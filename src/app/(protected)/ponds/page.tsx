'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

type Farm = { id: string; name: string; region: string | null }
type Pond = {
  id: string
  name: string
  area_acres: number | null
  farm_id: string
  farm?: { name?: string }
}
type Cycle = {
  id: string
  pond_id: string
  stocking_date: string
  seed_stocked: number
  pl: string | null
  pond?: { name?: string }
}

export default function PondsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [farmId, setFarmId] = useState('')
  const [pondId, setPondId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [farmResult, pondResult, cycleResult] = await Promise.all([
      supabase.from('farms').select('id, name, region').order('created_at'),
      supabase.from('ponds').select('id, name, area_acres, farm_id, farms(name)').order('created_at'),
      supabase.from('culture_cycles').select('id, pond_id, stocking_date, seed_stocked, pl, ponds(name)').order('stocking_date', { ascending: false }),
    ])
    const failed = [farmResult, pondResult, cycleResult].find((result) => result.error)
    if (failed?.error) setError(failed.error.message)
    else {
      setError('')
      setFarms((farmResult.data ?? []) as Farm[])
      setPonds((pondResult.data ?? []).map((row) => {
        const relation = row.farms as unknown as { name?: string } | null
        return { ...row, farm: relation ?? undefined }
      }) as Pond[])
      setCycles((cycleResult.data ?? []).map((row) => {
        const relation = row.ponds as unknown as { name?: string } | null
        return { ...row, pond: relation ?? undefined }
      }) as Cycle[])
      setFarmId((current) => current || farmResult.data?.[0]?.id || '')
      setPondId((current) => current || pondResult.data?.[0]?.id || '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function addPond(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    setError('')
    setSuccess('')
    const values = new FormData(event.currentTarget)
    try {
      const { error: insertError } = await supabase.from('ponds').insert({
        farm_id: farmId,
        name: String(values.get('name')).trim(),
        area_acres: values.get('area_acres') ? Number(values.get('area_acres')) : null,
      })
      if (insertError) throw insertError
      form.reset()
      setSuccess('Pond added to your farm.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add pond.')
    } finally {
      setSaving(false)
    }
  }

  async function addCycle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    setError('')
    setSuccess('')
    const values = new FormData(event.currentTarget)
    try {
      const { error: insertError } = await supabase.from('culture_cycles').insert({
        pond_id: pondId,
        seed_stocked: Number(values.get('seed_stocked')),
        stocking_date: String(values.get('stocking_date')),
        pl: String(values.get('pl')).trim() || null,
        target_harvest_days: values.get('target_harvest_days') ? Number(values.get('target_harvest_days')) : null,
      })
      if (insertError) throw insertError
      form.reset()
      setSuccess('Culture cycle started. Your logs can now be linked to it.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start the culture cycle.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div><span className="eyebrow">YOUR FARM FOUNDATION</span><h1>Ponds &amp; cycles</h1><p>Add ponds and start culture cycles. Water, feed, and growth logs will use these records instead of making you type a cycle ID.</p></div>
        <span className="heading-orbit" aria-hidden="true">◉</span>
      </div>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {success && <p className="form-message success-message" role="status">{success}</p>}
      {loading ? <section className="card-surface record-form-card"><p className="quiet-state">Loading your ponds…</p></section> : farms.length === 0 ? (
        <section className="empty-state card-surface">
          <span className="empty-icon" aria-hidden="true">✳</span>
          <h2>Start with your farm.</h2>
          <p>Create the farm, first pond, and current culture cycle together. Your log screens will then be ready to use.</p>
          <Link className="button-primary" href="/onboarding">Set up my farm <span aria-hidden="true">→</span></Link>
        </section>
      ) : (
        <>
          <div className="farm-manage-grid">
            <section className="card-surface record-form-card animate-in animate-delay">
              <div className="card-heading"><div><span className="eyebrow">GROWING SPACE</span><h2>Add a pond</h2></div><span className="insight-glyph">◌</span></div>
              <form className="record-form" onSubmit={addPond}>
                <label className="field"><span>Farm</span><select value={farmId} onChange={(event) => setFarmId(event.target.value)} required>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label>
                <label className="field"><span>Pond name</span><Input name="name" placeholder="e.g. Pond 02" required minLength={1} /></label>
                <label className="field"><span>Area in acres <small>Optional</small></span><Input name="area_acres" type="number" min="0.01" step="0.01" placeholder="1.5" /></label>
                <Button type="submit" className="button-primary submit-button" disabled={saving}>Add pond <span aria-hidden="true">→</span></Button>
              </form>
            </section>
            <section className="card-surface record-form-card animate-in animate-delay-2">
              <div className="card-heading"><div><span className="eyebrow">A NEW GROWING SEASON</span><h2>Start a cycle</h2></div><span className="insight-glyph warm">↗</span></div>
              {ponds.length === 0 ? <p className="quiet-state">Add a pond first, then start its first culture cycle.</p> : (
                <form className="record-form" onSubmit={addCycle}>
                  <label className="field"><span>Pond</span><select value={pondId} onChange={(event) => setPondId(event.target.value)} required>{ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.name} · {pond.farm?.name}</option>)}</select></label>
                  <div className="field-grid">
                    <label className="field"><span>Seed stock</span><Input name="seed_stocked" type="number" min="1" step="1" placeholder="50000" required /></label>
                    <label className="field"><span>Stocking date</span><Input name="stocking_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                  </div>
                  <div className="field-grid">
                    <label className="field"><span>PL stage <small>Optional</small></span><Input name="pl" placeholder="PL12" /></label>
                    <label className="field"><span>Target days <small>Optional</small></span><Input name="target_harvest_days" type="number" min="1" placeholder="120" /></label>
                  </div>
                  <Button type="submit" className="button-primary submit-button" disabled={saving}>Start this cycle <span aria-hidden="true">→</span></Button>
                </form>
              )}
            </section>
          </div>
          <section className="card-surface pond-overview-card">
            <div className="card-heading"><div><span className="eyebrow">YOUR OPERATION</span><h2>Ponds and active cycles</h2></div><span className="record-count">{ponds.length} <small>ponds</small></span></div>
            {ponds.length === 0 ? <p className="quiet-state">No ponds added yet.</p> : (
              <div className="pond-list">
                {ponds.map((pond) => {
                  const pondCycles = cycles.filter((cycle) => cycle.pond_id === pond.id)
                  return <article className="pond-list-item" key={pond.id}>
                    <span className="pond-list-icon">◌</span>
                    <div><strong>{pond.name}</strong><span>{pond.farm?.name}{pond.area_acres ? ` · ${pond.area_acres} acres` : ''}</span></div>
                    <div className="pond-cycle-list">{pondCycles.length ? pondCycles.map((cycle) => <span key={cycle.id} className="cycle-chip">PL {cycle.pl ?? '—'} · {cycle.seed_stocked.toLocaleString()} stocked · {cycle.stocking_date}</span>) : <span className="quiet-state">No cycle yet</span>}</div>
                  </article>
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
