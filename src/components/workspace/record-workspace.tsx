'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

type RecordKind = 'water' | 'feed' | 'growth' | 'expenses'
type FarmOption = { id: string; name: string }
type CycleOption = {
  id: string
  stocking_date: string
  pond?: { name?: string; farm?: { name?: string } }
}
type RecentRecord = Record<string, string | number | null>

const config: Record<
  RecordKind,
  { title: string; eyebrow: string; description: string; table: string; dateColumn: string; cta: string }
> = {
  water: {
    title: 'Water quality',
    eyebrow: 'POND CONDITIONS',
    description: 'Log the readings that keep your shrimp healthy and your water in balance.',
    table: 'water_logs',
    dateColumn: 'logged_at',
    cta: 'Save water log',
  },
  feed: {
    title: 'Feed log',
    eyebrow: 'DAILY ROUTINE',
    description: 'Track what you feed, how much, and when—so every cycle tells a clearer story.',
    table: 'feed_logs',
    dateColumn: 'logged_at',
    cta: 'Save feeding',
  },
  growth: {
    title: 'Growth sampling',
    eyebrow: 'CYCLE PROGRESS',
    description: 'Record sample size and average body weight to see how your stock is growing.',
    table: 'growth_samples',
    dateColumn: 'sampled_at',
    cta: 'Save sample',
  },
  expenses: {
    title: 'Farm expenses',
    eyebrow: 'FARM FINANCES',
    description: 'Keep farm costs together and see where your operating budget is going.',
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

export function RecordWorkspace({ kind }: { kind: RecordKind }) {
  const page = config[kind]
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [cycles, setCycles] = useState<CycleOption[]>([])
  const [records, setRecords] = useState<RecentRecord[]>([])
  const [farmId, setFarmId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadRecords = useCallback(async () => {
    const result = await supabase
      .from(page.table)
      .select('*')
      .order(page.dateColumn, { ascending: false })
      .limit(6)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setRecords((result.data ?? []) as RecentRecord[])
  }, [page.dateColumn, page.table])

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      setLoading(true)
      const [farmResult, cycleResult] = await Promise.all([
        supabase.from('farms').select('id, name').order('created_at'),
        supabase
          .from('culture_cycles')
          .select('id, stocking_date, ponds(name, farms(name))')
          .order('stocking_date', { ascending: false }),
      ])
      if (cancelled) return
      if (farmResult.error) setError(farmResult.error.message)
      if (cycleResult.error) setError(cycleResult.error.message)
      const farmRows = (farmResult.data ?? []) as FarmOption[]
      const cycleRows = (cycleResult.data ?? []).map((row) => {
        const relation = row.ponds as unknown as
          | { name?: string; farms?: { name?: string } }
          | null
        return {
          ...row,
          pond: { name: relation?.name, farm: relation?.farms },
        }
      }) as CycleOption[]
      setFarms(farmRows)
      setCycles(cycleRows)
      setFarmId((current) => current || farmRows[0]?.id || '')
      setCycleId((current) => current || cycleRows[0]?.id || '')
      await loadRecords()
      if (!cancelled) setLoading(false)
    }
    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [loadRecords])

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
    const timestamp = (name: string) => new Date(get(name)).toISOString()
    let table = page.table
    let payload: Record<string, string | number | null>

    if (kind === 'water') {
      const formData = {
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
        const response = await fetch('/api/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Could not save water log.')
        setMessage('Water log saved. Your pond readings are up to date.')
        formElement.reset()
        await loadRecords()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save water log.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (kind === 'feed') {
      payload = {
        cycle_id: cycleId,
        logged_at: timestamp('logged_at'),
        feed_type: get('feed_type'),
        amount_kg: Number(get('amount_kg')),
        feeding_frequency: get('feeding_frequency') || null,
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
        farm_id: farmId,
        spent_at: get('spent_at'),
        category: get('category'),
        description: get('description'),
        amount: Number(get('amount')),
      }
      table = 'expenses'
    }

    try {
      const { error: insertError } = await supabase.from(table).insert(payload)
      if (insertError) throw insertError
      setMessage(
        kind === 'feed'
          ? 'Feeding saved. Nice work keeping your cycle on track.'
          : kind === 'growth'
            ? 'Growth sample saved. Your cycle progress is updated.'
            : 'Expense saved to your farm records.',
      )
      formElement.reset()
      await loadRecords()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this record.')
    } finally {
      setSaving(false)
    }
  }

  const canRecord = kind === 'expenses' ? farms.length > 0 : cycles.length > 0
  const selectedCycle = cycles.find((cycle) => cycle.id === cycleId)

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <span className="heading-orbit" aria-hidden="true">
          {kind === 'water' ? '◌' : kind === 'feed' ? '◈' : kind === 'growth' ? '↗' : '＄'}
        </span>
      </div>

      {!loading && !canRecord ? (
        <section className="empty-state card-surface animate-in">
          <span className="empty-icon" aria-hidden="true">✳</span>
          <h2>Your first pond is one small step away.</h2>
          <p>Create your farm, pond, and culture cycle once. Then your records can be connected to the right shrimp.</p>
          <Link className="button-primary" href="/onboarding">Set up my farm <span aria-hidden="true">→</span></Link>
        </section>
      ) : (
        <div className="record-layout">
          <section className="card-surface record-form-card animate-in">
            <div className="card-heading">
              <div>
                <span className="eyebrow">NEW RECORD</span>
                <h2>Add today&apos;s entry</h2>
              </div>
              <span className="card-heading-dot" />
            </div>
            {loading ? (
              <p className="quiet-state">Loading your ponds…</p>
            ) : (
              <form className="record-form" onSubmit={save}>
                {kind === 'expenses' ? (
                  <label className="field">
                    <span>Farm</span>
                    <select required value={farmId} onChange={(event) => setFarmId(event.target.value)}>
                      {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="field">
                    <span>Culture cycle</span>
                    <select required value={cycleId} onChange={(event) => setCycleId(event.target.value)}>
                      {cycles.map((cycle) => (
                        <option key={cycle.id} value={cycle.id}>
                          {cycle.pond?.name ?? 'Pond'} · {cycle.pond?.farm?.name ?? 'Farm'} · started {cycle.stocking_date}
                        </option>
                      ))}
                    </select>
                    {selectedCycle && <small>This record will be linked to {selectedCycle.pond?.name ?? 'your selected pond'}.</small>}
                  </label>
                )}
                {kind === 'water' && <WaterFields dateTime={localDateTime()} />}
                {kind === 'feed' && (
                  <>
                    <div className="field-grid">
                      <label className="field"><span>Feed type</span><input name="feed_type" placeholder="e.g. Grower pellet" required /></label>
                      <label className="field"><span>Amount (kg)</span><input name="amount_kg" type="number" min="0.01" step="0.01" placeholder="25" required /></label>
                    </div>
                    <div className="field-grid">
                      <label className="field"><span>Date &amp; time</span><input name="logged_at" type="datetime-local" defaultValue={localDateTime()} required /></label>
                      <label className="field"><span>Frequency</span><input name="feeding_frequency" placeholder="e.g. 3 times daily" /></label>
                    </div>
                    <label className="field"><span>Notes <small>Optional</small></span><textarea name="comment" rows={3} placeholder="Anything to note about this feeding?" /></label>
                  </>
                )}
                {kind === 'growth' && (
                  <>
                    <div className="field-grid">
                      <label className="field"><span>Average weight (g)</span><input name="average_weight_g" type="number" min="0.01" step="0.01" placeholder="12.5" required /></label>
                      <label className="field"><span>Shrimp sampled</span><input name="sample_size" type="number" min="1" step="1" placeholder="30" required /></label>
                    </div>
                    <label className="field"><span>Sampled on</span><input name="sampled_at" type="datetime-local" defaultValue={localDateTime()} required /></label>
                    <label className="field"><span>Notes <small>Optional</small></span><textarea name="notes" rows={3} placeholder="Sample location, observations…" /></label>
                  </>
                )}
                {kind === 'expenses' && (
                  <>
                    <div className="field-grid">
                      <label className="field"><span>Category</span><select name="category" required defaultValue=""><option value="" disabled>Choose a category</option><option>Feed</option><option>Seed stock</option><option>Labor</option><option>Electricity</option><option>Equipment</option><option>Water treatment</option><option>Other</option></select></label>
                      <label className="field"><span>Amount (₹)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
                    </div>
                    <div className="field-grid">
                      <label className="field"><span>Date</span><input name="spent_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                      <label className="field"><span>Description</span><input name="description" placeholder="What was this expense for?" required /></label>
                    </div>
                  </>
                )}
                {kind === 'water' && (
                  <label className="field"><span>Notes <small>Optional</small></span><textarea name="comment" rows={3} placeholder="Observations from the pond…" /></label>
                )}
                {error && <p className="form-message error-message" role="alert">{error}</p>}
                {message && <p className="form-message success-message" role="status">{message}</p>}
                <Button type="submit" disabled={saving || loading} className="button-primary submit-button">
                  {saving ? 'Saving your record…' : page.cta} <span aria-hidden="true">→</span>
                </Button>
              </form>
            )}
          </section>

          <section className="card-surface recent-card animate-in animate-delay">
            <div className="card-heading">
              <div>
                <span className="eyebrow">YOUR FARM JOURNAL</span>
                <h2>Recent entries</h2>
              </div>
              <span className="record-count">{records.length} <small>recent</small></span>
            </div>
            {loading ? <p className="quiet-state">Finding your latest records…</p> : records.length === 0 ? (
              <div className="journal-empty">
                <span aria-hidden="true">✧</span>
                <p>Your entries will show up here.</p>
                <small>A consistent log makes good decisions easier.</small>
              </div>
            ) : (
              <ul className="journal-list">
                {records.map((record) => (
                  <li key={String(record.id)} className="journal-row">
                    <span className="journal-dot" />
                    <div className="journal-copy">
                      <strong>{recentTitle(kind, record)}</strong>
                      <span>{new Date(String(record[page.dateColumn])).toLocaleString()}</span>
                    </div>
                    <span className="journal-value">{recentValue(kind, record)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="journal-footer"><span className="status-pulse" />Synced with your farm records</div>
          </section>
        </div>
      )}
    </div>
  )
}

function WaterFields({ dateTime }: { dateTime: string }) {
  return (
    <>
      <label className="field"><span>Reading time</span><input name="logged_at" type="datetime-local" defaultValue={dateTime} required /></label>
      <div className="water-field-grid">
        {[
          ['temperature_c', 'Temperature', '°C', '28'],
          ['pH', 'pH', 'scale', '7.8'],
          ['do_mg_l', 'Dissolved oxygen', 'mg/L', '5.5'],
          ['salinity_pps', 'Salinity', 'ppt', '15'],
          ['ammonia_mg_l', 'Ammonia', 'mg/L', '0.02'],
          ['nitrite_mg_l', 'Nitrite', 'mg/L', '0.1'],
          ['alkalinity_ppms', 'Alkalinity', 'ppm', '120'],
          ['transparency_lux', 'Transparency', 'cm', '35'],
        ].map(([name, label, unit, placeholder]) => (
          <label className="field" key={name}>
            <span>{label} <small>{unit}</small></span>
            <input name={name} type="number" step="0.01" placeholder={placeholder} />
          </label>
        ))}
      </div>
    </>
  )
}

function recentTitle(kind: RecordKind, record: RecentRecord) {
  if (kind === 'water') return 'Water quality check'
  if (kind === 'feed') return displayValue(record.feed_type)
  if (kind === 'growth') return 'Growth sample'
  return displayValue(record.category)
}

function recentValue(kind: RecordKind, record: RecentRecord) {
  if (kind === 'water') return `pH ${displayValue(record.pH)}`
  if (kind === 'feed') return `${displayValue(record.amount_kg)} kg`
  if (kind === 'growth') return `${displayValue(record.average_weight_g)} g avg.`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(record.amount))
}
