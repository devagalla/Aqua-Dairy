import { supabase } from '@/lib/supabase/client'

export const OFFLINE_QUEUE_EVENT = 'aqua-dairy-offline-queue-change'
const DATABASE_NAME = 'aqua-dairy-offline'
const DATABASE_VERSION = 1

export type OfflineTable = 'water_logs' | 'feed_logs' | 'growth_samples' | 'expenses'
export type QueueStatus = 'pending' | 'syncing' | 'failed'

export type QueuedRecord = {
  id: string
  userId: string
  table: OfflineTable
  data: Record<string, unknown>
  queuedAt: string
  retryCount: number
  status: QueueStatus
  lastError: string | null
}

export type CachedRecordOptions = {
  farms: Array<{ id: string; name: string }>
  cycles: Array<Record<string, unknown>>
}

export function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (!error || typeof error !== 'object') return false
  const candidate = error as { name?: unknown; message?: unknown }
  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : ''
  return candidate.name === 'FetchError' ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('networkerror') ||
    message.includes('network request failed')
}

type StoredOptions = {
  key: string
  userId: string
  value: CachedRecordOptions
  savedAt: string
}

let databasePromise: Promise<IDBDatabase> | null = null
const activeSyncUsers = new Set<string>()

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('This browser does not support offline record storage.'))
  }
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('records')) {
        database.createObjectStore('records', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('options')) {
        database.createObjectStore('options', { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      databasePromise = null
      reject(request.error ?? new Error('Could not open offline record storage.'))
    }
    request.onblocked = () => {
      databasePromise = null
      reject(new Error('Offline record storage is blocked by another open tab.'))
    }
  })
  return databasePromise
}

function runTransaction<T>(
  storeName: 'records' | 'options',
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    let result: T
    const request = action(transaction.objectStore(storeName))
    request.onsuccess = () => { result = request.result }
    request.onerror = () => reject(request.error ?? new Error('Offline storage request failed.'))
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error ?? new Error('Offline storage transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage transaction was cancelled.'))
  }))
}

function announceQueueChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENT))
  }
}

export async function readQueuedRecords(userId: string, table?: OfflineTable): Promise<QueuedRecord[]> {
  const records = await runTransaction('records', 'readonly', (store) => store.getAll())
  return records
    .filter((record) => record.userId === userId && (!table || record.table === table))
    .sort((left, right) => right.queuedAt.localeCompare(left.queuedAt))
}

export async function queueOfflineRecord(
  userId: string,
  table: OfflineTable,
  data: Record<string, unknown>,
): Promise<QueuedRecord> {
  if (!userId) throw new Error('Sign in while connected before saving offline records.')
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(`Could not verify the account for offline storage: ${sessionError.message}`)
  if (sessionData.session?.user.id !== userId) {
    throw new Error('The signed-in account changed. Refresh the page before saving this offline record.')
  }
  const id = typeof data.id === 'string' ? data.id : crypto.randomUUID()
  const record: QueuedRecord = {
    id,
    userId,
    table,
    data: { ...data, id },
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
    lastError: null,
  }
  await runTransaction('records', 'readwrite', (store) => store.put(record))
  announceQueueChange()
  return record
}

export async function removeQueuedRecord(userId: string, id: string): Promise<void> {
  const records = await readQueuedRecords(userId)
  if (!records.some((record) => record.id === id)) {
    throw new Error('This pending record does not belong to the signed-in account.')
  }
  await runTransaction('records', 'readwrite', (store) => store.delete(id))
  announceQueueChange()
}

async function updateQueuedRecord(record: QueuedRecord): Promise<void> {
  await runTransaction('records', 'readwrite', (store) => store.put(record))
  announceQueueChange()
}

export async function retryQueuedRecord(userId: string, id: string): Promise<void> {
  const records = await readQueuedRecords(userId)
  const record = records.find((item) => item.id === id)
  if (!record) throw new Error('This pending record is no longer in the offline queue.')
  await updateQueuedRecord({ ...record, retryCount: 0, status: 'pending', lastError: null })
}

export async function cacheRecordOptions(
  userId: string,
  value: CachedRecordOptions,
): Promise<void> {
  if (!userId) return
  const stored: StoredOptions = {
    key: userId,
    userId,
    value,
    savedAt: new Date().toISOString(),
  }
  await runTransaction('options', 'readwrite', (store) => store.put(stored))
}

export async function readCachedRecordOptions(userId: string): Promise<CachedRecordOptions | null> {
  if (!userId) return null
  const stored = await runTransaction('options', 'readonly', (store) => store.get(userId))
  return stored?.userId === userId ? stored.value : null
}

async function syncRecord(record: QueuedRecord): Promise<void> {
  if (record.table === 'water_logs') {
    const response = await fetch('/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record.data),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? 'Could not sync water log.')
    if (result.alert_warning) throw new Error(result.alert_warning)
    return
  }

  const { error } = await supabase
    .from(record.table)
    .upsert(record.data, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function syncQueuedRecords(userId: string): Promise<void> {
  if (!userId || typeof navigator === 'undefined' || !navigator.onLine || activeSyncUsers.has(userId)) return
  activeSyncUsers.add(userId)

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(`Could not verify the account for offline sync: ${error.message}`)
    if (data.session?.user.id !== userId) {
      throw new Error('Offline records are waiting for the account that saved them to sign in.')
    }
    const records = (await readQueuedRecords(userId)).filter((record) => record.status !== 'failed')
    for (const record of records) {
      let current = record
      let completed = false
      while (!completed && current.retryCount < 3) {
        if (!navigator.onLine) {
          await updateQueuedRecord({ ...current, status: 'pending' })
          return
        }
        current = { ...current, status: 'syncing', lastError: null }
        await updateQueuedRecord(current)
        try {
          await syncRecord(current)
          await removeQueuedRecord(userId, current.id)
          completed = true
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : 'Could not sync this record.'
          if (!navigator.onLine) {
            await updateQueuedRecord({ ...current, status: 'pending', lastError: message })
            return
          }
          const retryCount = current.retryCount + 1
          current = {
            ...current,
            retryCount,
            status: retryCount >= 3 ? 'failed' : 'pending',
            lastError: message,
          }
          await updateQueuedRecord(current)
          if (retryCount < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** (retryCount - 1))))
          }
        }
      }
    }
  } finally {
    activeSyncUsers.delete(userId)
  }
}
