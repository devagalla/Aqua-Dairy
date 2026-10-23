'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

type AlertRecord = {
  id: string
  severity: string | null
  message: string | null
  action: string | null
  created_at: string
  water_log_id: string | null
  acknowledged_at: string | null
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error: queryError } = await supabase
        .from('alert_log')
        .select('id, severity, message, action, created_at, water_log_id, acknowledged_at')
        .order('created_at', { ascending: false })
        .limit(30)
      if (cancelled) return
      if (queryError) setError(queryError.message)
      else setAlerts((data ?? []) as AlertRecord[])
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  async function acknowledge(alert: AlertRecord) {
    setAcknowledgingId(alert.id)
    setError('')
    const { data, error: updateError } = await supabase
      .from('alert_log')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', alert.id)
      .is('acknowledged_at', null)
      .select('id, acknowledged_at')
      .maybeSingle()

    if (updateError) {
      setError(`Could not acknowledge this alert: ${updateError.message}`)
    } else if (data?.acknowledged_at) {
      setAlerts((current) => current.map((item) =>
        item.id === alert.id ? { ...item, acknowledged_at: data.acknowledged_at } : item,
      ))
    } else {
      const { data: currentAlert, error: refreshError } = await supabase
        .from('alert_log')
        .select('acknowledged_at')
        .eq('id', alert.id)
        .maybeSingle()
      if (refreshError) setError(`Could not verify the alert status: ${refreshError.message}`)
      else if (currentAlert?.acknowledged_at) {
        setAlerts((current) => current.map((item) =>
          item.id === alert.id ? { ...item, acknowledged_at: currentAlert.acknowledged_at } : item,
        ))
      } else setError('The alert was not updated. Please try again.')
    }
    setAcknowledgingId(null)
  }

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">EARLY SIGNALS, BETTER DECISIONS</span>
          <h1>Farm alerts</h1>
          <p>Keep an eye on water readings that fall outside your advisor rules.</p>
        </div>
        <span className="heading-orbit" aria-hidden="true">◇</span>
      </div>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <section className="card-surface alert-list-card animate-in animate-delay">
        {loading ? <p className="quiet-state">Checking your farm alerts…</p> : alerts.length === 0 ? (
          <div className="empty-state compact-empty">
            <span className="empty-icon" aria-hidden="true">✧</span>
            <h2>Clear waters so far.</h2>
            <p>When a water reading needs a closer look, its alert and suggested action will appear here.</p>
            <Link href="/water" className="text-link">Log a water reading <span aria-hidden="true">→</span></Link>
          </div>
        ) : (
          <ul className="alerts-list">
            {alerts.map((alert) => (
              <li className="alert-item" key={alert.id}>
                <span className={`alert-severity severity-${alert.severity?.toLowerCase() ?? 'yellow'}`} />
                <div>
                  <span className="eyebrow">{alert.severity ?? 'NOTICE'} · {new Date(alert.created_at).toLocaleString()}</span>
                  <h2>{alert.message ?? 'Water reading needs attention'}</h2>
                  {alert.action && <p>Suggested action: {alert.action}</p>}
                </div>
                {alert.water_log_id && <Link href="/water" className="text-link">View water log <span aria-hidden="true">→</span></Link>}
                {alert.acknowledged_at ? (
                  <span className="alert-acknowledged" role="status">Acknowledged · {new Date(alert.acknowledged_at).toLocaleDateString('en-IN')}</span>
                ) : (
                  <Button
                    type="button"
                    className="farm-add-toggle alert-acknowledge"
                    disabled={acknowledgingId === alert.id}
                    onClick={() => void acknowledge(alert)}
                  >
                    {acknowledgingId === alert.id ? 'Saving…' : 'Acknowledge'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}