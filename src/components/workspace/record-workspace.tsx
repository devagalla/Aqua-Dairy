'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TeluguHint } from '@/components/ui/telugu-hint'
import {
  OFFLINE_QUEUE_EVENT,
  cacheRecordOptions,
  isNetworkFailure,
  queueOfflineRecord,
  readCachedRecordOptions,
  readQueuedRecords,
  removeQueuedRecord,
  retryQueuedRecord,
  syncQueuedRecords,
  type OfflineTable,
  type QueuedRecord,
} from '@/lib/offline/queue'
import { supabase } from '@/lib/supabase/client'
import { getWaterReadingStatus, type WaterAdvisorRule } from '@/utils/water-status'

type RecordKind = 'water' | 'feed' | 'growth' | 'expenses'
type FarmOption = { id: string; name: string }
type PondOption = { id: string; name: string; farmId: string; farmName: string }
type CycleOption = {
  id: string
  pond_id: string
  stocking_date: string
  status: 'active' | 'completed'
  pond?: { id?: string; name?: string; farm_id?: string; farm?: { name?: string } }
}
type RecentRecord = { id: string } & Record<string, string | number | null>
type FinanceSummary = {
  total_income: number
  total_expenses: number
  net_profit: number
  funding_received: number
}
const HISTORY_PAGE_SIZE = 10

const config: Record<
  RecordKind,
  { title: string; eyebrow: string; description: string; teluguDescription: string; table: string; dateColumn: string; cta: string }
> = {
  water: {
    title: 'Water quality',
    eyebrow: 'POND CONDITIONS',
    description: 'Log the readings that keep your shrimp healthy and your water in balance.',
    teluguDescription: 'చెరువు నీటి పరిస్థితి తెలుసుకోవడానికి ఈ రీడింగ్‌లు నమోదు చేయండి.',
    table: 'water_logs',
    dateColumn: 'logged_at',
    cta: 'Save water log',
  },
  feed: {
    title: 'Feed log',
    eyebrow: 'DAILY ROUTINE',
    description: 'Track what you feed, how much, and when—so every cycle tells a clearer story.',
    teluguDescription: 'ఏ మేత, ఎంత మోతాదులో, ఎప్పుడు ఇచ్చారో నమోదు చేయండి.',
    table: 'feed_logs',
    dateColumn: 'logged_at',
    cta: 'Save feeding',
  },
  growth: {
    title: 'Growth sampling',
    eyebrow: 'CYCLE PROGRESS',
    description: 'Record sample size and average body weight to see how your stock is growing.',
    teluguDescription: 'కొన్ని రొయ్యలను తూచి సగటు బరువు నమోదు చేస్తే పెరుగుదల తెలుస్తుంది.',
    table: 'growth_samples',
    dateColumn: 'sampled_at',
    cta: 'Save sample',
  },
  expenses: {
    title: 'Farm finances',
    eyebrow: 'FARM FINANCES',
    description: 'Track money spent and received, and see your recorded farm earnings at a glance.',
    teluguDescription: 'ఫారం ఖర్చులు, వచ్చిన ఆదాయం, రుణాలు నమోదు చేసి మొత్తం లెక్కను చూడండి.',
    table: 'expenses',
    dateColumn: 'spent_at',
    cta: 'Save expense',
  },
}

function localDateTime() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function displayValue(value: string | number | null | undefined) {
  if (value == null || value === '') return '—'
  return String(value)
}

function formatRupees(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function RecordWorkspace({ kind }: { kind: RecordKind }) {
  const page = config[kind]
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [cycles, setCycles] = useState<CycleOption[]>([])
  const [ponds, setPonds] = useState<PondOption[]>([])
  const [records, setRecords] = useState<RecentRecord[]>([])
  const [userId, setUserId] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [farmId, setFarmId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [expenseScope, setExpenseScope] = useState<'farm' | 'pond'>('farm')
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const [feedEntryMode, setFeedEntryMode] = useState<'single' | 'daily_summary'>('single')
  const [waterRules, setWaterRules] = useState<WaterAdvisorRule[]>([])
  const [waterRulesError, setWaterRulesError] = useState('')
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasMoreRecords, setHasMoreRecords] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  const loadRecords = useCallback(async (from = 0) => {
    let queued: QueuedRecord[] = []
    if (userId) {
      try {
        queued = await readQueuedRecords(userId, page.table as OfflineTable)
      } catch (caught) {
        setError(caught instanceof Error ? `Offline record storage is unavailable: ${caught.message}` : 'Offline record storage is unavailable.')
      }
    }
    const localRows = queued.map((item) => ({
      ...item.data,
      id: item.id,
      [page.dateColumn]: item.data[page.dateColumn] ?? item.queuedAt,
      ...(item.table === 'water_logs' ? { ph: item.data.ph ?? item.data.pH ?? null } : {}),
      _offline_status: item.status,
      _offline_error: item.lastError,
    })) as RecentRecord[]
    const result = await supabase
      .from(page.table)
      .select('*')
      .order(page.dateColumn, { ascending: false })
      .range(Math.max(0, from - localRows.length), Math.max(0, from - localRows.length) + HISTORY_PAGE_SIZE)
    if (result.error) {
      if (from === 0) setRecords(localRows)
      setHasMoreRecords(false)
      setError(localRows.length > 0 ? '' : result.error.message)
      return false
    }
    const serverRows = ((result.data ?? []) as RecentRecord[]).slice(0, HISTORY_PAGE_SIZE)
    const rows = [...localRows, ...serverRows]
      .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index)
      .sort((left, right) =>
        new Date(String(right[page.dateColumn])).getTime() -
        new Date(String(left[page.dateColumn])).getTime(),
      )
    setHasMoreRecords(((result.data ?? []) as RecentRecord[]).length > HISTORY_PAGE_SIZE)
    setRecords((current) => from > 0
      ? [...current.filter((record) => record._offline_status), ...current.filter((record) => !record._offline_status), ...serverRows]
          .filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id) === index)
          .sort((left, right) =>
            new Date(String(right[page.dateColumn])).getTime() -
            new Date(String(left[page.dateColumn])).getTime(),
          )
      : rows)
    return true
  }, [page.dateColumn, page.table, userId])

  const loadFinanceSummary = useCallback(async () => {
    const { data, error: summaryError } = await supabase.rpc('get_expense_dashboard')
    if (summaryError) {
      setError(`Could not load farm finance totals: ${summaryError.message}`)
      return false
    }
    const row = (data as FinanceSummary[] | null)?.[0]
    setFinanceSummary(row ?? {
      total_income: 0,
      total_expenses: 0,
      net_profit: 0,
      funding_received: 0,
    })
    return true
  }, [])

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return
      if (sessionError) setError(`Could not load your saved session: ${sessionError.message}`)
      else setUserId(data.session?.user.id ?? '')
      setSessionReady(true)
    }).catch((caught: unknown) => {
      if (!cancelled) {
        setError(caught instanceof Error ? caught.message : 'Could not load your saved session.')
        setSessionReady(true)
      }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      setLoading(true)
      const [farmResult, cycleResult] = await Promise.all([
        supabase.from('farms').select('id, name').order('created_at'),
        supabase
          .from('culture_cycles')
          .select('id, pond_id, stocking_date, status, ponds(id, name, farm_id, farms(name))')
          .eq('status', 'active')
          .order('stocking_date', { ascending: false }),
      ])
      if (cancelled) return
      if (kind === 'water') {
        const { data, error: ruleError } = await supabase
          .from('advisor_rules')
          .select('parameter, min_threshold, max_threshold, severity, message_en')
          .eq('enabled', true)
        if (ruleError) setWaterRulesError(ruleError.message)
        else {
          setWaterRules((data ?? []) as WaterAdvisorRule[])
          setWaterRulesError('')
        }
      }
      if (cancelled) return
      let farmRows = (farmResult.data ?? []) as FarmOption[]
      let cycleRows = (cycleResult.data ?? []).map((row) => {
        const relation = row.ponds as
          | { id?: string; name?: string; farm_id?: string; farms?: { name?: string } }
          | null
        return {
          ...row,
          pond: {
            id: relation?.id,
            name: relation?.name,
            farm_id: relation?.farm_id,
            farm: relation?.farms,
          },
        }
      }) as CycleOption[]
      const optionsError = farmResult.error ?? cycleResult.error
      if (optionsError) {
        if ((!navigator.onLine || isNetworkFailure(optionsError)) && userId) {
          try {
            const cachedOptions = await readCachedRecordOptions(userId)
            if (cancelled) return
            if (cachedOptions) {
              farmRows = cachedOptions.farms
              cycleRows = cachedOptions.cycles as CycleOption[]
              setError('Offline mode: using the farm and cycle details saved on this device.')
            } else {
              setError('You are offline and no farm details are saved on this device yet. Reconnect once to prepare offline logging.')
            }
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not read your saved farm details.')
          }
        } else {
          setError(optionsError.message)
        }
      } else {
        setError('')
        if (userId) {
          try {
            await cacheRecordOptions(userId, {
              farms: farmRows,
              cycles: cycleRows.map((cycle) => ({ ...cycle })),
            })
            if (cancelled) return
          } catch (caught) {
            setError(caught instanceof Error ? `Offline setup could not be saved: ${caught.message}` : 'Offline setup could not be saved.')
          }
        }
      }
      const pondRows = new Map<string, PondOption>()
      for (const cycle of cycleRows) {
        if (!cycle.pond_id || pondRows.has(cycle.pond_id)) continue
        pondRows.set(cycle.pond_id, {
          id: cycle.pond_id,
          name: cycle.pond?.name ?? 'Pond',
          farmId: cycle.pond?.farm_id ?? '',
          farmName: cycle.pond?.farm?.name ?? 'Farm',
        })
      }
      setFarms(farmRows)
      setCycles(cycleRows)
      setPonds(Array.from(pondRows.values()))
      setFarmId((current) => current || farmRows[0]?.id || '')
      setCycleId((current) => current || cycleRows[0]?.id || '')
      await loadRecords()
      if (kind === 'expenses') await loadFinanceSummary()
      if (!cancelled) setLoading(false)
    }
    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [kind, loadFinanceSummary, loadRecords, userId])

  useEffect(() => {
    const refresh = () => {
      void loadRecords()
      if (kind === 'expenses') void loadFinanceSummary()
    }
    window.addEventListener(OFFLINE_QUEUE_EVENT, refresh)
    return () => window.removeEventListener(OFFLINE_QUEUE_EVENT, refresh)
  }, [kind, loadFinanceSummary, loadRecords])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setMessage('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const get = (name: string) => String(form.get(name) ?? '').trim()
    const numberOrNull = (name: string) => {
      const value = get(name)
      return value === '' ? null : Number(value)
    }
    const recordFarmId = expenseScope === 'pond' ? selectedCycle?.pond?.farm_id ?? '' : farmId
    if (kind === 'expenses' && !recordFarmId) {
      setError(`Choose a farm or pond for this ${transactionType === 'income' ? 'income' : 'expense'} record.`)
      setSaving(false)
      return
    }
    const timestamp = (name: string) => new Date(get(name)).toISOString()
    let table = page.table
    let payload: Record<string, string | number | null>
    const recordId = crypto.randomUUID()

    if (kind === 'water') {
      const formData = {
        id: recordId,
        cycle_id: cycleId,
        logged_at: timestamp('logged_at'),
        temperature_c: numberOrNull('temperature_c'),
        pH: numberOrNull('pH'),
        do_mg_l: numberOrNull('do_mg_l'),
        salinity_pps: numberOrNull('salinity_pps'),
        ammonia_mg_l: numberOrNull('ammonia_mg_l'),
        nitrite_mg_l: numberOrNull('nitrite_mg_l'),
        alkalinity_ppms: numberOrNull('alkalinity_ppms'),
        transparency_lux: numberOrNull('transparency_lux'),
        comment: get('comment') || null,
      }
      try {
        if (!navigator.onLine) {
          await queueOfflineRecord(userId, 'water_logs', formData)
          setMessage('Water log saved on this device. It will sync when you are back online.')
          formElement.reset()
          await loadRecords()
          return
        }
        const response = await fetch('/api/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Could not save water log.')
        setMessage('Water log saved. Your pond readings are up to date.')
        if (result.alert_warning) setError(result.alert_warning)
        formElement.reset()
        await loadRecords()
      } catch (caught) {
        if (!navigator.onLine || isNetworkFailure(caught)) {
          try {
            await queueOfflineRecord(userId, 'water_logs', formData)
            setMessage('Connection was lost. Water log is saved locally and queued to sync.')
            formElement.reset()
            await loadRecords()
          } catch (queueError) {
            setError(queueError instanceof Error
              ? `Could not save the water log offline: ${queueError.message}`
              : 'Could not save the water log offline.')
          }
        } else {
          setError(caught instanceof Error ? caught.message : 'Could not save water log.')
        }
      } finally {
        setSaving(false)
      }
      return
    }

    if (kind === 'feed') {
      payload = {
        cycle_id: cycleId,
        logged_at: feedEntryMode === 'single'
          ? timestamp('logged_at')
          : new Date(`${get('summary_date')}T12:00:00`).toISOString(),
        feed_type: get('feed_type'),
        amount_kg: Number(get('amount_kg')),
        entry_mode: feedEntryMode,
        feeding_count: feedEntryMode === 'daily_summary' ? Number(get('feeding_count')) : 1,
        comment: get('comment') || null,
      }
    } else if (kind === 'growth') {
      payload = {
        cycle_id: cycleId,
        sampled_at: timestamp('sampled_at'),
        sample_size: Number(get('sample_size')),
        average_weight_g: Number(get('average_weight_g')),
        notes: get('notes') || null,
      }
    } else {
      payload = {
        farm_id: recordFarmId,
        cycle_id: expenseScope === 'pond' ? cycleId : null,
        spent_at: get('spent_at'),
        transaction_type: transactionType,
        category: get('category'),
        description: get('description'),
        amount: Number(get('amount')),
      }
      table = 'expenses'
    }

    payload.id = recordId
    try {
      if (!navigator.onLine) {
        await queueOfflineRecord(userId, table as OfflineTable, payload)
        setMessage('Entry saved on this device. It will sync when you are back online.')
        formElement.reset()
        await loadRecords()
        return
      }
      const { error: insertError } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
      if (insertError) throw insertError
      setMessage(
        kind === 'feed'
          ? 'Feeding saved. Nice work keeping your cycle on track.'
          : kind === 'growth'
            ? 'Growth sample saved. Your cycle progress is updated.'
            : transactionType === 'income'
              ? 'Money received saved to your farm records.'
              : 'Expense saved to your farm records.',
      )
      formElement.reset()
      await loadRecords()
      if (kind === 'expenses') await loadFinanceSummary()
    } catch (caught) {
      if (!navigator.onLine || isNetworkFailure(caught)) {
        try {
          await queueOfflineRecord(userId, table as OfflineTable, payload)
          setMessage('Connection was lost. Entry is saved locally and queued to sync.')
          formElement.reset()
          await loadRecords()
        } catch (queueError) {
          setError(queueError instanceof Error
            ? `Could not save this record offline: ${queueError.message}`
            : 'Could not save this record offline.')
        }
      } else {
        setError(caught instanceof Error ? caught.message : 'Could not save this record.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(record: RecentRecord) {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setError('')
    setMessage('')
    setDeletingRecordId(record.id)
    try {
      if (typeof record._offline_status === 'string') {
        await removeQueuedRecord(userId, record.id)
        setMessage('Pending entry removed from this device.')
        await loadRecords()
        return
      }
      const { error: deleteError } = await supabase
        .from(page.table)
        .delete()
        .eq('id', record.id)
      if (deleteError) throw deleteError
      setMessage('Entry deleted.')
      await loadRecords()
      if (kind === 'expenses') await loadFinanceSummary()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete this entry.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  async function retryOfflineRecord(record: RecentRecord) {
    setError('')
    setMessage('')
    setDeletingRecordId(record.id)
    try {
      await retryQueuedRecord(userId, record.id)
      await syncQueuedRecords(userId)
      await loadRecords()
      if (kind === 'expenses') await loadFinanceSummary()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not retry this record.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  async function loadMoreRecords() {
    setError('')
    setLoadingMore(true)
    try {
      await loadRecords(records.filter((record) => typeof record._offline_status !== 'string').length)
    } finally {
      setLoadingMore(false)
    }
  }

  const canRecord = kind === 'expenses' ? farms.length > 0 : cycles.length > 0
  const selectedCycle = cycles.find((cycle) => cycle.id === cycleId)
  const selectedPondId = selectedCycle?.pond_id ?? ''

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <span className="telugu-subtitle" lang="te">{page.teluguDescription}</span>
        </div>
        <span className="heading-orbit" aria-hidden="true">
          {kind === 'water' ? '◌' : kind === 'feed' ? '◈' : kind === 'growth' ? '↗' : '＄'}
        </span>
      </div>

      {kind === 'expenses' && (
        <section className="finance-dashboard card-surface" aria-label="Farm finance summary">
          <div className="card-heading">
            <div>
              <span className="eyebrow">RECORDED TOTALS</span>
              <h2>Income, costs &amp; earnings</h2>
            </div>
          </div>
          {financeSummary ? (
            <div className="stats-grid">
              <article className="stat-card">
                <span className="stat-label">Farm income</span>
                <strong>{formatRupees(financeSummary.total_income)}</strong>
                <span className="stat-note">Sales &amp; other farm income</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Expenses</span>
                <strong>{formatRupees(financeSummary.total_expenses)}</strong>
                <span className="stat-note">Recorded farm costs</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Net farm earnings</span>
                <strong>{formatRupees(financeSummary.net_profit)}</strong>
                <span className="stat-note">Income minus expenses</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Loans &amp; contributions</span>
                <strong>{formatRupees(financeSummary.funding_received)}</strong>
                <span className="stat-note">Tracked separately from earnings</span>
              </article>
            </div>
          ) : (
            <p className="quiet-state">{loading ? 'Loading your finance totals…' : 'Finance totals are unavailable.'}</p>
          )}
          <p className="finance-disclaimer">Totals include records entered in Aqua Dairy. Net farm earnings are recorded sales and other farm income minus recorded expenses; loans and owner contributions are not counted as earnings.</p>
        </section>
      )}

      {!loading && !canRecord && (
        <section className="empty-state card-surface animate-in">
          <span className="empty-icon" aria-hidden="true">✳</span>
          <h2>{farms.length === 0 ? 'Your first pond is one small step away.' : 'No active culture cycle right now.'}</h2>
          <p>{farms.length === 0
            ? 'Create your farm, pond, and culture cycle once. Then your records can be connected to the right shrimp.'
            : 'Complete the previous cycle and start a new batch from Ponds & cycles before adding current readings.'}</p>
          <Link className="button-primary" href={farms.length === 0 ? '/onboarding' : '/ponds'}>
            {farms.length === 0 ? 'Set up my farm' : 'Manage ponds & cycles'} <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
      {canRecord && (
        <div className="record-layout">
          <section className="card-surface record-form-card animate-in">
            <div className="card-heading">
              <div>
                <span className="eyebrow">NEW RECORD</span>
                <h2>Add today&apos;s entry</h2>
              </div>
              <span className="card-heading-dot" />
            </div>
            {loading || !sessionReady ? (
              <p className="quiet-state">Loading your ponds…</p>
            ) : (
              <form className="record-form" onSubmit={save}>
                {kind === 'expenses' ? (
                  <>
                    <label className="field">
                      <span>Record scope</span>
                      <select value={expenseScope} onChange={(event) => setExpenseScope(event.target.value === 'pond' ? 'pond' : 'farm')}>
                        <option value="farm">Farm-wide record</option>
                        <option value="pond" disabled={ponds.length === 0}>Specific pond / cycle</option>
                      </select>
                      <TeluguHint>మొత్తం ఫారానికి లేదా ఒక చెరువు బ్యాచ్‌కు ఈ లావాదేవీని జత చేయండి.</TeluguHint>
                    </label>
                    {expenseScope === 'farm' ? (
                      <label className="field">
                        <span>Farm</span>
                        <select required value={farmId} onChange={(event) => setFarmId(event.target.value)}>
                          {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                        </select>
                        <TeluguHint>ఈ లావాదేవీ ఏ ఫారానికి చెందుతుందో ఎంచుకోండి.</TeluguHint>
                      </label>
                    ) : (
                      <label className="field">
                        <span>Pond</span>
                        <select
                          required
                          value={selectedPondId}
                          onChange={(event) => setCycleId(cycles.find((cycle) => cycle.pond_id === event.target.value)?.id ?? '')}
                        >
                          {ponds.map((pond) => {
                            const cycle = cycles.find((candidate) => candidate.pond_id === pond.id)
                            return <option key={pond.id} value={pond.id}>{pond.name} · {pond.farmName}{cycle ? ` · ${cycle.stocking_date}` : ''}</option>
                          })}
                        </select>
                        <TeluguHint>ఈ లావాదేవీ ఏ చెరువు పెంపకం బ్యాచ్‌కు చెందుతుందో ఎంచుకోండి.</TeluguHint>
                      </label>
                    )}
                    <label className="field">
                      <span>Money flow</span>
                      <select value={transactionType} onChange={(event) => setTransactionType(event.target.value === 'income' ? 'income' : 'expense')}>
                        <option value="expense">Money spent — expense</option>
                        <option value="income">Money received</option>
                      </select>
                      <TeluguHint>ఖర్చు చేసిన డబ్బునా, మీకు వచ్చిన డబ్బునా ఎంచుకోండి.</TeluguHint>
                    </label>
                  </>
                ) : (
                  <label className="field">
                    <span>Pond</span>
                    <select
                      required
                      value={selectedPondId}
                      onChange={(event) => setCycleId(cycles.find((cycle) => cycle.pond_id === event.target.value)?.id ?? '')}
                    >
                      {ponds.map((pond) => {
                        const cycle = cycles.find((candidate) => candidate.pond_id === pond.id)
                        return <option key={pond.id} value={pond.id}>{pond.name} · {pond.farmName}{cycle ? ` · started ${cycle.stocking_date}` : ''}</option>
                      })}
                    </select>
                    <TeluguHint>ఈ వివరాలు ఏ చెరువు పెంపకం బ్యాచ్‌కు చెందుతాయో ఎంచుకోండి.</TeluguHint>
                    {selectedCycle && <small>This record will be linked to {selectedCycle.pond?.name ?? 'your selected pond'}.</small>}
                  </label>
                )}
                {kind === 'water' && (
                  <>
                    {waterRulesError && <p className="form-message error-message" role="status">Reading guidance is unavailable: {waterRulesError}</p>}
                    <WaterFields dateTime={localDateTime()} rules={waterRules} />
                  </>
                )}
                {kind === 'feed' && (
                  <>
                    <div className="field-grid">
                      <label className="field">
                        <span>Entry type</span>
                        <select value={feedEntryMode} onChange={(event) => setFeedEntryMode(event.target.value === 'daily_summary' ? 'daily_summary' : 'single')}>
                          <option value="single">One feeding</option>
                          <option value="daily_summary">Whole-day summary</option>
                        </select>
                        <TeluguHint>ఒక్కసారి వేసిన మేతనా, ఆ రోజు మొత్తం లెక్కనా ఎంచుకోండి.</TeluguHint>
                      </label>
                      <label className="field"><span>Feed type</span><input name="feed_type" placeholder="e.g. Grower pellet" required /><TeluguHint>ఇచ్చిన మేత పేరు లేదా రకం రాయండి.</TeluguHint></label>
                    </div>
                    <div className="field-grid">
                      <label className="field">
                        <span>{feedEntryMode === 'single' ? 'Amount for this feeding (kg)' : 'Total feed for the day (kg)'}</span>
                        <input name="amount_kg" type="number" min="0.01" step="0.01" placeholder="25" required />
                        <TeluguHint>{feedEntryMode === 'single' ? 'ఈ ఒక్కసారి ఇచ్చిన మేత కిలోల్లో.' : 'ఆ రోజు మొత్తం ఇచ్చిన మేత కిలోల్లో.'}</TeluguHint>
                      </label>
                      {feedEntryMode === 'daily_summary' ? (
                        <label className="field"><span>Feedings that day</span><input name="feeding_count" type="number" min="1" step="1" placeholder="4" required /><TeluguHint>ఆ రోజు నిజంగా ఎన్నిసార్లు మేత వేశారు?</TeluguHint></label>
                      ) : (
                        <label className="field"><span>Date &amp; time</span><input name="logged_at" type="datetime-local" defaultValue={localDateTime()} required /><TeluguHint>ఈసారి మేత వేసిన సమయం.</TeluguHint></label>
                      )}
                    </div>
                    {feedEntryMode === 'daily_summary' && <label className="field"><span>Date</span><input name="summary_date" type="date" defaultValue={localDateTime().slice(0, 10)} required /><TeluguHint>ఈ రోజు మొత్తం మేత లెక్క నమోదు చేస్తున్న తేదీ.</TeluguHint></label>}
                    <label className="field"><span>Notes <small>Optional</small></span><textarea name="comment" rows={3} placeholder="Anything to note about this feeding?" /><TeluguHint>మేత గురించి గుర్తుంచుకోవాల్సిన విషయం ఉంటే రాయండి.</TeluguHint></label>
                  </>
                )}
                {kind === 'growth' && (
                  <>
                    <div className="field-grid">
                      <label className="field"><span>Average weight (g)</span><input name="average_weight_g" type="number" min="0.01" step="0.01" placeholder="12.5" required /><TeluguHint>తూచిన రొయ్యల సగటు బరువు గ్రాముల్లో.</TeluguHint></label>
                      <label className="field"><span>Shrimp sampled</span><input name="sample_size" type="number" min="1" step="1" placeholder="30" required /><TeluguHint>తూకం కోసం ఎన్ని రొయ్యలు తీసుకున్నారో.</TeluguHint></label>
                    </div>
                    <label className="field"><span>Sampled on</span><input name="sampled_at" type="datetime-local" defaultValue={localDateTime()} required /><TeluguHint>రొయ్యల నమూనా తీసుకున్న తేదీ, సమయం.</TeluguHint></label>
                    <label className="field"><span>Notes <small>Optional</small></span><textarea name="notes" rows={3} placeholder="Sample location, observations…" /><TeluguHint>నమూనా తీసుకున్న చోటు లేదా గమనించిన విషయాలు.</TeluguHint></label>
                  </>
                )}
                {kind === 'expenses' && (
                  <>
                    <div className="field-grid">
                      <label className="field">
                        <span>Category</span>
                        <select name="category" required defaultValue="">
                          <option value="" disabled>Choose a category</option>
                          {transactionType === 'income'
                            ? <><option>Harvest sale</option><option>Other farm income</option><option>Loan received</option><option>Owner contribution</option></>
                            : <><option>Feed</option><option>Seed stock</option><option>Labor</option><option>Electricity</option><option>Equipment</option><option>Water treatment</option><option>Other</option></>}
                        </select>
                        <TeluguHint>{transactionType === 'income' ? 'వచ్చిన డబ్బు అమ్మకం, ఇతర ఆదాయం, రుణం లేదా మీ పెట్టుబడో ఎంచుకోండి.' : 'ఖర్చు దేనికి చేశారో ఎంచుకోండి.'}</TeluguHint>
                      </label>
                      <label className="field"><span>Amount (₹)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /><TeluguHint>మొత్తం రూపాయల్లో నమోదు చేయండి.</TeluguHint></label>
                    </div>
                    <div className="field-grid">
                      <label className="field"><span>Date</span><input name="spent_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><TeluguHint>{transactionType === 'income' ? 'డబ్బు అందుకున్న తేదీ.' : 'ఖర్చు చేసిన తేదీ.'}</TeluguHint></label>
                      <label className="field"><span>Description</span><input name="description" placeholder={transactionType === 'income' ? 'Who paid or what was received?' : 'What was this expense for?'} required /><TeluguHint>{transactionType === 'income' ? 'ఎవరి నుంచి లేదా దేనికి సంబంధించిన డబ్బు వచ్చిందో రాయండి.' : 'ఈ ఖర్చు ఏ పనికి చేశారో కొద్దిగా వివరించండి.'}</TeluguHint></label>
                    </div>
                  </>
                )}
                {kind === 'water' && (
                  <label className="field"><span>Notes <small>Optional</small></span><textarea name="comment" rows={3} placeholder="Observations from the pond…" /><TeluguHint>చెరువులో గమనించిన విషయాలు రాయండి.</TeluguHint></label>
                )}
                <Button type="submit" disabled={saving || loading} className="button-primary submit-button">
                  {saving ? 'Saving your record…' : kind === 'expenses' ? transactionType === 'income' ? 'Save money received' : 'Save expense' : page.cta} <span aria-hidden="true">→</span>
                </Button>
              </form>
            )}
          </section>

        </div>
      )}
        <section className="card-surface recent-card animate-in animate-delay">
            <div className="card-heading">
              <div>
                <span className="eyebrow">YOUR FARM JOURNAL</span>
                <h2>Entry history</h2>
              </div>
              <span className="record-count">{records.length} <small>shown</small></span>
            </div>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}
            {loading ? <p className="quiet-state">Finding your latest records…</p> : records.length === 0 ? (
              <div className="journal-empty">
                <span aria-hidden="true">✧</span>
                <p>Your entries will show up here.</p>
                <small>A consistent log makes good decisions easier.</small>
              </div>
            ) : (
              <ul className="journal-list">
                {records.map((record) => (
                  <li
                    key={String(record.id)}
                    className={`journal-row${typeof record._offline_status === 'string' ? ' journal-row-pending' : ''}`}
                  >
                    <span className="journal-dot" />
                    <div className="journal-copy">
                      <strong>{recentTitle(kind, record)}</strong>
                      <span>{kind === 'feed' && record.entry_mode === 'daily_summary'
                        ? new Date(String(record[page.dateColumn])).toLocaleDateString()
                        : new Date(String(record[page.dateColumn])).toLocaleString()}</span>
                    </div>
                    <span className="journal-value">{recentValue(kind, record)}</span>
                    {typeof record._offline_status === 'string' && (
                      <span className={`journal-sync-state sync-${record._offline_status}`}>
                        {record._offline_status === 'failed'
                          ? `Sync failed${record._offline_error ? `: ${record._offline_error}` : ''}`
                          : record._offline_status === 'syncing'
                            ? 'Syncing…'
                            : 'Saved on this device · waiting to sync'}
                      </span>
                    )}
                    <details className="journal-details">
                      <summary>Details</summary>
                      <dl>
                        {recordDetails(kind, record).map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                    {record._offline_status === 'failed' && (
                      <Button
                        type="button"
                        className="farm-add-toggle journal-retry"
                        onClick={() => void retryOfflineRecord(record)}
                        disabled={deletingRecordId !== null}
                      >
                        {deletingRecordId === record.id ? 'Retrying…' : 'Retry sync'}
                      </Button>
                    )}
                    <button
                      type="button"
                      className="journal-delete"
                      onClick={() => void deleteRecord(record)}
                      disabled={deletingRecordId !== null}
                      aria-label={`Delete ${recentTitle(kind, record)} entry`}
                    >
                      {deletingRecordId === record.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {hasMoreRecords && (
              <Button
                type="button"
                className="journal-load-more"
                onClick={() => void loadMoreRecords()}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading history…' : 'Load more entries'}
              </Button>
            )}
            <div className="journal-footer"><span className="status-pulse" />Synced with your farm records</div>
        </section>
    </div>
  )
}

function WaterFields({ dateTime, rules }: { dateTime: string; rules: WaterAdvisorRule[] }) {
  const [values, setValues] = useState<Record<string, number | null>>({})

  return (
    <>
      <label className="field"><span>Reading time</span><input name="logged_at" type="datetime-local" defaultValue={dateTime} required /><TeluguHint>నీటి నమూనా తీసిన తేదీ, సమయం.</TeluguHint></label>
      <div className="water-field-grid">
        {[
          ['temperature_c', 'Temperature', '°C', '28', 'నీటి ఉష్ణోగ్రత డిగ్రీల సెల్సియస్‌లో.'],
          ['pH', 'pH', 'scale', '7.8', 'నీరు ఆమ్లంగా ఉందా, క్షారంగా ఉందా తెలిపే కొలత.'],
          ['do_mg_l', 'Dissolved oxygen', 'mg/L', '5.5', 'నీటిలో కరిగి ఉన్న ఆక్సిజన్ పరిమాణం.'],
          ['salinity_pps', 'Salinity', 'ppt', '15', 'నీటిలో ఉప్పుదనం; మీ మీటర్ చూపిన విలువ నమోదు చేయండి.'],
          ['ammonia_mg_l', 'Ammonia', 'mg/L', '0.02', 'నీటిలో అమ్మోనియా స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి.'],
          ['nitrite_mg_l', 'Nitrite', 'mg/L', '0.1', 'నీటిలో నైట్రైట్ స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి.'],
          ['alkalinity_ppms', 'Alkalinity', 'ppm', '120', 'నీటి క్షారత్వం; పరీక్ష కిట్ చూపిన ppm విలువ.'],
          ['transparency_lux', 'Transparency', 'cm', '35', 'నీరు ఎంత స్పష్టంగా ఉందో సె.మీ.లో నమోదు చేయండి.'],
        ].map(([name, label, unit, placeholder, hint]) => {
          const status = getWaterReadingStatus(name, values[name] ?? null, rules)
          return (
            <label className="field" key={name}>
              <span>{label} <small>{unit}</small></span>
              <input
                name={name}
                type="number"
                step="0.01"
                placeholder={placeholder}
                onChange={(event) => {
                  const rawValue = event.currentTarget.value
                  setValues((current) => ({
                    ...current,
                    [name]: rawValue === '' ? null : Number(rawValue),
                  }))
                }}
              />
              <TeluguHint>{hint}</TeluguHint>
              {status && (
                <small className={`water-reading-status status-${status.level}`} role="status">
                  <span aria-hidden="true" />
                  {status.message}
                </small>
              )}
            </label>
          )
        })}
      </div>
    </>
  )
}

function recentTitle(kind: RecordKind, record: RecentRecord) {
  if (kind === 'water') return 'Water quality check'
  if (kind === 'feed') {
    return `${displayValue(record.feed_type)}${record.entry_mode === 'daily_summary' ? ' · Daily summary' : ''}`
  }
  if (kind === 'growth') return 'Growth sample'
  return `${record.transaction_type === 'income' ? 'Money received' : 'Expense'} · ${displayValue(record.category)}`
}

function recentValue(kind: RecordKind, record: RecentRecord) {
  if (kind === 'water') return `pH ${displayValue(record.ph)}`
  if (kind === 'feed') {
    const amount = `${displayValue(record.amount_kg)} kg`
    const feedingCount = Number(record.feeding_count ?? 1)
    if (record.entry_mode === 'daily_summary') return `${amount} total · ${feedingCount} feedings`
    if (typeof record.feeding_frequency === 'string' && record.feeding_frequency.trim()) {
      return `${amount} · previous frequency note: ${record.feeding_frequency}`
    }
    return `${amount} · one feeding`
  }
  if (kind === 'growth') return `${displayValue(record.average_weight_g)} g avg.`
  const prefix = record.transaction_type === 'income' ? '+' : '−'
  return `${prefix}${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(record.amount))}`
}

function recordDetails(kind: RecordKind, record: RecentRecord): [string, string][] {
  const fields: Record<RecordKind, [string, string, string?][]> = {
    water: [
      ['Temperature', 'temperature_c', '°C'],
      ['pH', 'ph'],
      ['Dissolved oxygen', 'do_mg_l', 'mg/L'],
      ['Salinity', 'salinity_pps', 'ppt'],
      ['Ammonia', 'ammonia_mg_l', 'mg/L'],
      ['Nitrite', 'nitrite_mg_l', 'mg/L'],
      ['Alkalinity', 'alkalinity_ppms', 'ppm'],
      ['Transparency', 'transparency_lux', 'cm'],
      ['Notes', 'comment'],
    ],
    feed: [
      ['Feed type', 'feed_type'],
      ['Entry type', 'entry_mode'],
      ['Amount', 'amount_kg', 'kg'],
      ['Number of feedings', 'feeding_count'],
      ['Previous frequency note', 'feeding_frequency'],
      ['Notes', 'comment'],
    ],
    growth: [
      ['Average weight', 'average_weight_g', 'g'],
      ['Shrimp sampled', 'sample_size'],
      ['Notes', 'notes'],
    ],
    expenses: [
      ['Type', 'transaction_type'],
      ['Category', 'category'],
      ['Description', 'description'],
      ['Amount', 'amount', 'INR'],
    ],
  }

  return fields[kind].flatMap(([label, key, unit]) => {
    const value = record[key]
    if (value == null || value === '') return []
    const formatted = key === 'entry_mode'
      ? value === 'daily_summary' ? 'Whole-day summary' : 'One feeding'
      : key === 'transaction_type'
        ? value === 'income' ? 'Money received' : 'Expense'
      : key === 'amount' && kind === 'expenses'
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value))
        : `${value}${unit ? ` ${unit}` : ''}`
    return [[label, formatted]]
  })
}
