'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { OFFLINE_QUEUE_EVENT, readQueuedRecords, syncQueuedRecords } from '@/lib/offline/queue'
import { FarmProvider, useFarm } from '@/contexts/farm-context'

const links = [
  { href: '/dashboard', label: 'Home', glyph: '⌂' },
  { href: '/pond-log', label: 'Pond Log', glyph: '◉' },
  { href: '/feed-trays', label: 'Feed & Trays', glyph: '◈' },
  { href: '/market-prices', label: 'Market Prices', glyph: '＄' },
  { href: '/health', label: 'Shrimp Health', glyph: '✳' },
  { href: '/settings', label: 'Settings', glyph: '⚙' },
]


export function WorkspaceShell({
  children,
  email,
  userId,
}: {
  children: ReactNode
  email: string
  userId: string
}) {
  return (
    <FarmProvider userId={userId} userEmail={email}>
      <WorkspaceShellInner email={email} userId={userId}>
        {children}
      </WorkspaceShellInner>
    </FarmProvider>
  )
}

function WorkspaceShellInner({
  children,
  email,
  userId,
}: {
  children: ReactNode
  email: string
  userId: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { farmerName, farmName, location, ponds, activePondId, setActivePondId } = useFarm()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [offlineError, setOfflineError] = useState('')
  const [offlineStorageError, setOfflineStorageError] = useState('')
  const [serviceWorkerError, setServiceWorkerError] = useState('')

  useEffect(() => {
    let cancelled = false
    let syncingNow = false

    const refreshQueue = async () => {
      try {
        const records = await readQueuedRecords(userId)
        if (!cancelled) {
          setPendingCount(records.length)
          setFailedCount(records.filter((record) => record.status === 'failed').length)
          setOfflineStorageError('')
        }
      } catch (caught) {
        if (!cancelled) {
          setOfflineStorageError(caught instanceof Error ? caught.message : 'Could not open offline record storage.')
        }
      }
    }

    const sync = async () => {
      if (!navigator.onLine || syncingNow) return
      syncingNow = true
      setSyncing(true)
      try {
        await syncQueuedRecords(userId)
        if (!cancelled) setOfflineError('')
      } catch (caught) {
        if (!cancelled) {
          setOfflineError(caught instanceof Error ? caught.message : 'Could not sync saved records.')
        }
      } finally {
        syncingNow = false
        if (!cancelled) {
          setSyncing(false)
          await refreshQueue()
        }
      }
    }

    const handleOnline = () => {
      setIsOnline(true)
      void sync()
    }
    const handleOffline = () => setIsOnline(false)
    const handleQueueChange = () => {
      void refreshQueue()
      if (navigator.onLine) void sync()
    }

    setIsOnline(navigator.onLine)
    void refreshQueue()
    if (navigator.onLine) void sync()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange)
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/service-worker.js').catch((caught: unknown) => {
        if (!cancelled) {
          setServiceWorkerError(caught instanceof Error ? caught.message : 'Offline cache could not start.')
        }
      })
    }

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange)
    }
  }, [userId])

  async function signOut() {
    setSigningOut(true)
    setSignOutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSignOutError(error.message)
      setSigningOut(false)
      return
    }
    router.replace('/auth/signin')
  }

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Link href="/dashboard" className="brand-lockup">
          <span className="brand-mark">a</span>
          <span>Aqua<span className="brand-light">Dairy</span></span>
        </Link>
        <div className="sidebar-caption">FARM MANAGEMENT</div>
        <nav className="workspace-nav" aria-label="Farm management">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`workspace-nav-link${active ? ' active' : ''}`}
              >
                <span className="nav-glyph" aria-hidden="true">{link.glyph}</span>
                {link.label}
                {active && <span className="nav-indicator" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-orbit" aria-hidden="true">✳</span>
            <strong>Every detail counts.</strong>
            <span>Better data, healthier ponds.</span>
          </div>
          <div className="sidebar-actions">
            <Link href="/settings" className="sidebar-action-btn" title="Settings">
              <span aria-hidden="true">⚙</span>
              <span>Settings</span>
            </Link>
            <button
              className="profile-button"
              type="button"
              onClick={signOut}
              disabled={signingOut}
              title="Sign out"
            >
              <span className="profile-avatar">{email.charAt(0).toUpperCase() || 'F'}</span>
              <span className="profile-copy">
                <strong>{farmerName || email.split('@')[0] || 'Farm account'}</strong>
                <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
              </span>
              <span className="profile-exit" aria-hidden="true">↗</span>
            </button>
          </div>
          {signOutError && <p className="form-message error-message" role="alert">{signOutError}</p>}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <span className="topbar-eyebrow">
              {farmerName ? `Good to see you, ${farmerName}` : 'YOUR FARM, IN FOCUS'}
              <span className="telugu-subtitle ml-2" lang="te">{farmerName ? `${farmerName} గారు, స్వాగతం` : ''}</span>
            </span>
            <span className="topbar-date">
              📍 {farmName || 'Coastal Aqua Farm'} {location ? `• ${location}` : ''}
              <Link href="/ponds" className="ml-2 underline text-xs">Change</Link>
            </span>
            <span className={`offline-sync-status${!isOnline ? ' is-offline' : failedCount ? ' has-failures' : ''}`} role="status" aria-live="polite">
              {!isOnline
                ? `Offline · ${pendingCount} saved on this device`
                : syncing
                  ? 'Syncing saved records…'
                  : failedCount
                    ? `${failedCount} record${failedCount === 1 ? '' : 's'} need a retry`
                    : pendingCount
                      ? `${pendingCount} record${pendingCount === 1 ? '' : 's'} waiting to sync`
                      : 'All records synced'}
            </span>
          </div>
          <Link href="/ponds" className="topbar-setup">
            <span aria-hidden="true">＋</span> Ponds &amp; cycles
          </Link>
        </header>

        {ponds.length > 0 && (
          <div className="global-pond-switcher" role="region" aria-label="Global Pond Switcher">
            <span className="switcher-label">Active Pond:</span>
            <div className="switcher-pills">
              {ponds.map((p) => {
                const isActive = p.id === activePondId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePondId(p.id)}
                    className={`switcher-pill${isActive ? ' active' : ''}`}
                  >
                    <span className="pill-dot" aria-hidden="true" />
                    <strong>{p.name}</strong>
                    {p.activeCycle ? (
                      <span className="pill-doc">
                        {p.activeCycle.doc > 0 ? `DOC ${p.activeCycle.doc}` : ''}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <main className="workspace-content">{children}</main>
        {(offlineError || offlineStorageError || serviceWorkerError) && (
          <p className="offline-sync-error" role="alert">
            {offlineError || offlineStorageError || `Offline page caching could not start: ${serviceWorkerError}`}
          </p>
        )}
      </div>
      <nav className="mobile-workspace-nav" aria-label="Farm management">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname.startsWith(link.href) ? 'active' : ''}
          >
            <span aria-hidden="true">{link.glyph}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
