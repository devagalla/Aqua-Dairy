'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TeluguHint } from '@/components/ui/telugu-hint'
import { supabase } from '@/lib/supabase/client'

type RecordKind = 'water' | 'feed' | 'growth' | 'expenses'
type FarmOption = { id: string; name: string }
type PondOption = { id: string; name: string; farmId: string; farmName: string }
type CycleOption = {
  id: string
  pond_id: string
  stocking_date: string
  pond?: { id?: string; name?: string; farm_id?: string; farm?: { name?: string } }
}
type RecentRecord = { id: string } & Record<string, string | number | null>
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
    title: 'Farm expenses',
    eyebrow: 'FARM FINANCES',
    description: 'Keep farm costs together and see where your operating budget is going.',
    teluguDescription: 'ఫారం ఖర్చులు తేదీ, రకం, మొత్తంతో ఇక్కడ నమోదు చేయండి.',
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
  const [ponds, setPonds] = useState<PondOption[]>([])
  const [records, setRecords] = useState<RecentRecord[]>([])
  const [farmId, setFarmId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [expenseScope, setExpenseScope] = useState<'farm' | 'pond'>('farm')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasMoreRecords, setHasMoreRecords] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  const loadRecords = useCallback(async (from = 0) => {
    const result = await supabase
      .from(page.table)
      .select('*')
      .order(page.dateColumn, { ascending: false })
      .range(from, from + HISTORY_PAGE_SIZE)
    if (result.error) {
      setError(result.error.message)
      return false
    }
    const rows = (result.data ?? []) as RecentRecord[]
    setHasMoreRecords(rows.length > HISTORY_PAGE_SIZE)
    const visibleRows = rows.slice(0, HISTORY_PAGE_SIZE)
    setRecords((current) => from > 0 ? [...current, ...visibleRows] : visibleRows)
    return true
  }, [page.dateColumn, page.table])

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      setLoading(true)
      const [farmResult, cycleResult] = await Promise.all([
        supabase.from('farms').select('id, name').order('created_at'),
        supabase
          .from('culture_cycles')
          .select('id, pond_id, stocking_date, ponds(id, name, farm_id, farms(name))')
          .order('stocking_date', { ascending: false }),
      ])
      if (cancelled) return
      if (farmResult.error) setError(farmResult.error.message)
      if (cycleResult.error) setError(cycleResult.error.message)
      const farmRows = (farmResult.data ?? []) as FarmOption[]
      const cycleRows = (cycleResult.data ?? []).map((row) => {
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
    const recordFarmId = expenseScope === 'pond' ? selectedCycle?.pond?.farm_id ?? '' : farmId
    if (kind === 'expenses' && !recordFarmId) {
      setError('Choose a farm or pond for this expense.')
      setSaving(false)
      return
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
        farm_id: recordFarmId,
        cycle_id: expenseScope === 'pond' ? cycleId : null,
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

  async function deleteRecord(record: RecentRecord) {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setError('')
    setMessage('')
    setDeletingRecordId(record.id)
    try {
      const { error: deleteError } = await supabase
        .from(page.table)
        .delete()
        .eq('id', record.id)
      if (deleteError) throw deleteError
      setMessage('Entry deleted.')
      await loadRecords()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete this entry.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  async function loadMoreRecords() {
    setError('')
    setLoadingMore(true)
    try {
      await loadRecords(records.length)
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

      {!loading && !canRecord ? (
        <section className="empty-state card-surface animate-in">
          <span className="empty-icon" aria-hidden="true">✳</span>
          <h2>Your first pond is one small step away.</h2>
          <p>Create your farm, pond, and culture cycle once. Then your records can be connected to the right shrimp.</p>
          <Link className="button-primary" href="/onboarding">Set up my farm <span aria-hidden="true">→</span></Link>
        </section>
      ) : (
        <>
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
                  <>
                    <label className="field">
                      <span>Expense scope</span>
                      <select value={expenseScope} onChange={(event) => setExpenseScope(event.target.value === 'pond' ? 'pond' : 'farm')}>
                        <option value="farm">Farm-wide expense</option>
                        <option value="pond" disabled={ponds.length === 0}>Specific pond / cycle</option>
                      </select>
                      <TeluguHint>మొత్తం ఫారం ఖర్చుగా లేదా ఒక చెరువు బ్యాచ్ ఖర్చుగా నమోదు చేయండి.</TeluguHint>
                    </label>
                    {expenseScope === 'farm' ? (
                      <label className="field">
                        <span>Farm</span>
                        <select required value={farmId} onChange={(event) => setFarmId(event.target.value)}>
                          {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                        </select>
                        <TeluguHint>ఈ ఖర్చు ఏ ఫారానికి చెందుతుందో ఎంచుకోండి.</TeluguHint>
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
                        <TeluguHint>ఈ ఖర్చు ఏ చెరువు పెంపకం బ్యాచ్‌కు చెందుతుందో ఎంచుకోండి.</TeluguHint>
                      </label>
                    )}
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
                {kind === 'water' && <WaterFields dateTime={localDateTime()} />}
                {kind === 'feed' && (
                  <>
                    <div className="field-grid">
                      <label className="field"><span>Feed type</span><input name="feed_type" placeholder="e.g. Grower pellet" required /><TeluguHint>ఇచ్చిన మేత పేరు లేదా రకం రాయండి.</TeluguHint></label>
                      <label className="field"><span>Amount (kg)</span><input name="amount_kg" type="number" min="0.01" step="0.01" placeholder="25" required /><TeluguHint>ఈసారి ఇచ్చిన మేత కిలోలలో.</TeluguHint></label>
                    </div>
                    <div className="field-grid">
                      <label className="field"><span>Date &amp; time</span><input name="logged_at" type="datetime-local" defaultValue={localDateTime()} required /><TeluguHint>మేత ఇచ్చిన తేదీ, సమయం.</TeluguHint></label>
                      <label className="field"><span>Frequency</span><input name="feeding_frequency" placeholder="e.g. 3 times daily" /><TeluguHint>రోజుకు ఎన్నిసార్లు మేత వేస్తున్నారో రాయండి.</TeluguHint></label>
                    </div>
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
                      <label className="field"><span>Category</span><select name="category" required defaultValue=""><option value="" disabled>Choose a category</option><option>Feed</option><option>Seed stock</option><option>Labor</option><option>Electricity</option><option>Equipment</option><option>Water treatment</option><option>Other</option></select><TeluguHint>ఖర్చు దేనికి చేశారో ఎంచుకోండి.</TeluguHint></label>
                      <label className="field"><span>Amount (₹)</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /><TeluguHint>ఖర్చు చేసిన మొత్తం రూపాయల్లో.</TeluguHint></label>
                    </div>
                    <div className="field-grid">
                      <label className="field"><span>Date</span><input name="spent_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><TeluguHint>ఖర్చు చేసిన తేదీ.</TeluguHint></label>
                      <label className="field"><span>Description</span><input name="description" placeholder="What was this expense for?" required /><TeluguHint>ఈ ఖర్చు ఏ పనికి చేశారో కొద్దిగా వివరించండి.</TeluguHint></label>
                    </div>
                  </>
                )}
                {kind === 'water' && (
                  <label className="field"><span>Notes <small>Optional</small></span><textarea name="comment" rows={3} placeholder="Observations from the pond…" /><TeluguHint>చెరువులో గమనించిన విషయాలు రాయండి.</TeluguHint></label>
                )}
                <Button type="submit" disabled={saving || loading} className="button-primary submit-button">
                  {saving ? 'Saving your record…' : page.cta} <span aria-hidden="true">→</span>
                </Button>
              </form>
            )}
          </section>

        </div>
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
                  <li key={String(record.id)} className="journal-row">
                    <span className="journal-dot" />
                    <div className="journal-copy">
                      <strong>{recentTitle(kind, record)}</strong>
                      <span>{new Date(String(record[page.dateColumn])).toLocaleString()}</span>
                    </div>
                    <span className="journal-value">{recentValue(kind, record)}</span>
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
        </>
      )}
    </div>
  )
}

function WaterFields({ dateTime }: { dateTime: string }) {
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
        ].map(([name, label, unit, placeholder, hint]) => (
          <label className="field" key={name}>
            <span>{label} <small>{unit}</small></span>
            <input name={name} type="number" step="0.01" placeholder={placeholder} />
            <TeluguHint>{hint}</TeluguHint>
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
  if (kind === 'water') return `pH ${displayValue(record.ph)}`
  if (kind === 'feed') return `${displayValue(record.amount_kg)} kg`
  if (kind === 'growth') return `${displayValue(record.average_weight_g)} g avg.`
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(record.amount))
}
