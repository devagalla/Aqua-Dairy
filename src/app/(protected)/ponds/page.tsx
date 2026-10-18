'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TeluguHint } from '@/components/ui/telugu-hint'
import { PondLocationPicker, type PondLocation } from '@/components/workspace/pond-location-picker'
import { supabase } from '@/lib/supabase/client'

type Farm = { id: string; name: string; region: string | null }
type Pond = {
  id: string
  name: string
  area_acres: number | null
  farm_id: string
  locality: string | null
  latitude: number | null
  longitude: number | null
  farm?: { name?: string }
}
type Cycle = {
  id: string
  pond_id: string
  stocking_date: string
  seed_stocked: number
  pl: string | null
  status: 'active' | 'completed'
  completed_at: string | null
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
  const [showFarmForm, setShowFarmForm] = useState(false)
  const [newPondLocation, setNewPondLocation] = useState<PondLocation | null>(null)
  const [locationPickerVersion, setLocationPickerVersion] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [farmResult, pondResult, cycleResult] = await Promise.all([
      supabase.from('farms').select('id, name, region').order('created_at'),
      supabase.from('ponds').select('id, name, area_acres, farm_id, locality, latitude, longitude, farms(name)').order('created_at'),
      supabase.from('culture_cycles').select('id, pond_id, stocking_date, seed_stocked, pl, status, completed_at, ponds(name)').order('stocking_date', { ascending: false }),
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

  async function addFarm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data: newFarmId, error: createError } = await supabase.rpc('create_farm', {
        farm_name_input: String(values.get('farm_name')).trim(),
        region_input: String(values.get('region')).trim() || null,
      })
      if (createError) throw createError
      if (!newFarmId) throw new Error('Farm creation did not return a farm ID.')
      form.reset()
      await load()
      setFarmId(newFarmId)
      setShowFarmForm(false)
      setSuccess('Farm added. Select it below when you add its first pond.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add farm.')
    } finally {
      setSaving(false)
    }
  }

  async function addPond(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    setError('')
    setSuccess('')
    const values = new FormData(event.currentTarget)
    try {
      const { error: insertError } = await supabase.rpc('create_pond_with_cycle', {
        farm_id_input: farmId,
        pond_name_input: String(values.get('name')).trim(),
        area_acres_input: values.get('area_acres') ? Number(values.get('area_acres')) : null,
        seed_stocked_input: Number(values.get('seed_stocked')),
        stocking_date_input: String(values.get('stocking_date')),
        pl_input: String(values.get('pl')).trim() || null,
        target_harvest_days_input: values.get('target_harvest_days')
          ? Number(values.get('target_harvest_days'))
          : null,
        locality_input: newPondLocation?.label ?? null,
        latitude_input: newPondLocation?.latitude ?? null,
        longitude_input: newPondLocation?.longitude ?? null,
      })
      if (insertError) throw insertError
      form.reset()
      setNewPondLocation(null)
      setLocationPickerVersion((version) => version + 1)
      setSuccess('Pond added and its culture cycle started. You can now link logs to it.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add pond.')
    } finally {
      setSaving(false)
    }
  }

  async function savePondLocation(pondId: string, location: PondLocation | null) {
    const { error: updateError } = await supabase
      .from('ponds')
      .update({
        locality: location?.label ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      })
      .eq('id', pondId)
    if (updateError) throw updateError
    await load()
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
        pond_id: String(values.get('pond_id')),
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

  async function completeCycle(cycleId: string) {
    if (!window.confirm('Mark this culture cycle as completed? New logs will use the next cycle you start.')) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { error: completeError } = await supabase.rpc('complete_culture_cycle', {
        target_cycle_id: cycleId,
      })
      if (completeError) throw completeError
      setSuccess('Cycle marked completed. You can now start the next batch in this pond.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not complete this culture cycle.')
    } finally {
      setSaving(false)
    }
  }

  const pondsReadyForCycle = ponds.filter(
    (pond) => !cycles.some((cycle) => cycle.pond_id === pond.id && cycle.status === 'active'),
  )

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div><span className="eyebrow">YOUR FARM FOUNDATION</span><h1>Ponds &amp; cycles</h1><p>Add ponds and start culture cycles. Water, feed, and growth logs will use these records instead of making you type a cycle ID.</p><span className="telugu-subtitle" lang="te">చెరువులు, పెంపకం బ్యాచ్‌లు ఇక్కడ నమోదు చేయండి. నీరు, మేత, ఎదుగుదల వివరాలు తర్వాత సరైన బ్యాచ్‌కు జత అవుతాయి.</span></div>
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
          <section className="card-surface record-form-card">
            <div className="card-heading">
              <div><span className="eyebrow">MANAGE MORE THAN ONE FARM</span><h2>Add another farm</h2></div>
              <Button
                type="button"
                className="farm-add-toggle"
                aria-expanded={showFarmForm}
                aria-controls="add-farm-form"
                onClick={() => setShowFarmForm((shown) => !shown)}
              >
                {showFarmForm ? 'Cancel' : '＋ Add farm'}
              </Button>
            </div>
            <p className="quiet-state">Give each farm its own name, then add ponds and cycles under the right farm.</p>
            {showFarmForm && (
              <form id="add-farm-form" className="record-form" onSubmit={addFarm}>
                <div className="field-grid">
                  <label className="field"><span>Farm name</span><Input name="farm_name" placeholder="e.g. Ramesh Farm" required minLength={2} /><TeluguHint>వేర్వేరు ఫారాలను గుర్తించేందుకు యజమాని పేరు లేదా ఫారం పేరు పెట్టండి.</TeluguHint></label>
                  <label className="field"><span>Region <small>Optional</small></span><Input name="region" placeholder="e.g. Andhra Pradesh" /><TeluguHint>ఈ ఫారం ఉన్న గ్రామం లేదా ప్రాంతం.</TeluguHint></label>
                </div>
                <Button type="submit" className="button-primary submit-button" disabled={saving}>Save farm <span aria-hidden="true">→</span></Button>
              </form>
            )}
          </section>
          <div className="farm-manage-grid">
            <section className="card-surface record-form-card animate-in animate-delay">
              <div className="card-heading"><div><span className="eyebrow">GROWING SPACE</span><h2>Add a pond &amp; start its cycle</h2></div><span className="insight-glyph">◌</span></div>
              <p className="quiet-state">Enter the seed stock and stocking date here too, so your new pond is ready for logs right away.</p>
              <form className="record-form" onSubmit={addPond}>
                <label className="field"><span>Farm</span><select value={farmId} onChange={(event) => setFarmId(event.target.value)} required>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select><TeluguHint>ఈ చెరువు ఏ ఫారానికి చెందుతుందో ఎంచుకోండి.</TeluguHint></label>
                <label className="field"><span>Pond name</span><Input name="name" placeholder="e.g. Pond 02" required minLength={1} /><TeluguHint>గుర్తుపట్టేందుకు చెరువుకు పేరు లేదా నంబర్ పెట్టండి.</TeluguHint></label>
                <label className="field"><span>Area in acres <small>Optional</small></span><Input name="area_acres" type="number" min="0.01" step="0.01" placeholder="1.5" /><TeluguHint>చెరువు విస్తీర్ణం ఎకరాల్లో రాయండి.</TeluguHint></label>
                <PondLocationPicker key={locationPickerVersion} onSelect={setNewPondLocation} onQueryChange={() => setNewPondLocation(null)} />
                <div className="field-grid">
                  <label className="field"><span>Seed stock</span><Input name="seed_stocked" type="number" min="1" step="1" placeholder="50000" required /><TeluguHint>ఈ చెరువులో వదిలిన పిల్ల రొయ్యల సంఖ్య.</TeluguHint></label>
                  <label className="field"><span>Stocking date</span><Input name="stocking_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><TeluguHint>పిల్ల రొయ్యలను ఈ చెరువులో వదిలిన తేదీ.</TeluguHint></label>
                </div>
                <div className="field-grid">
                  <label className="field"><span>PL stage <small>Optional</small></span><Input name="pl" placeholder="PL12" /><TeluguHint>హ్యాచరీ నుంచి వచ్చిన పిల్ల రొయ్యల దశ; ఉదా: PL12.</TeluguHint></label>
                  <label className="field"><span>Target days <small>Optional</small></span><Input name="target_harvest_days" type="number" min="1" placeholder="120" /><TeluguHint>కోతకు లక్ష్యంగా పెట్టుకున్న పెంపకం రోజులు.</TeluguHint></label>
                </div>
                <Button type="submit" className="button-primary submit-button" disabled={saving}>Add pond &amp; start cycle <span aria-hidden="true">→</span></Button>
              </form>
            </section>
            <section className="card-surface record-form-card animate-in animate-delay-2">
              <div className="card-heading"><div><span className="eyebrow">RESTOCK OR BEGIN AGAIN</span><h2>Start another cycle</h2></div><span className="insight-glyph warm">↗</span></div>
              <p className="quiet-state">Use this when a pond already exists and you are starting a new batch in it.</p>
              {ponds.length === 0 ? <p className="quiet-state">Add a pond first, then start its first culture cycle.</p> : pondsReadyForCycle.length === 0 ? (
                <p className="quiet-state">Every pond already has an active cycle. Mark a cycle completed below before starting its next batch.</p>
              ) : (
                <form className="record-form" onSubmit={addCycle}>
                  <label className="field"><span>Pond</span><select name="pond_id" value={pondsReadyForCycle.some((pond) => pond.id === pondId) ? pondId : pondsReadyForCycle[0].id} onChange={(event) => setPondId(event.target.value)} required>{pondsReadyForCycle.map((pond) => <option key={pond.id} value={pond.id}>{pond.name} · {pond.farm?.name}</option>)}</select><TeluguHint>మునుపటి బ్యాచ్ పూర్తయిన చెరువును ఎంచుకోండి.</TeluguHint></label>
                  <div className="field-grid">
                    <label className="field"><span>Seed stock</span><Input name="seed_stocked" type="number" min="1" step="1" placeholder="50000" required /><TeluguHint>చెరువులో వదిలిన పిల్ల రొయ్యల మొత్తం సంఖ్య.</TeluguHint></label>
                    <label className="field"><span>Stocking date</span><Input name="stocking_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><TeluguHint>పిల్ల రొయ్యలను చెరువులో వదిలిన తేదీ.</TeluguHint></label>
                  </div>
                  <div className="field-grid">
                    <label className="field"><span>PL stage <small>Optional</small></span><Input name="pl" placeholder="PL12" /><TeluguHint>PL అంటే పోస్ట్‌ లార్వా దశ. హ్యాచరీ పిల్ల రొయ్యల దశ సంఖ్య; ఉదా: PL12.</TeluguHint></label>
                    <label className="field"><span>Target days <small>Optional</small></span><Input name="target_harvest_days" type="number" min="1" placeholder="120" /><TeluguHint>పిల్ల రొయ్యలను వదిలిన రోజు నుంచి కోతకు లక్ష్యంగా పెట్టుకున్న రోజులు.</TeluguHint></label>
                  </div>
                  <Button type="submit" className="button-primary submit-button" disabled={saving}>Start this cycle <span aria-hidden="true">→</span></Button>
                </form>
              )}
            </section>
          </div>
          <section className="card-surface pond-overview-card">
            <div className="card-heading"><div><span className="eyebrow">YOUR OPERATION</span><h2>Ponds and culture cycles</h2></div><span className="record-count">{ponds.length} <small>ponds</small></span></div>
            {ponds.length === 0 ? <p className="quiet-state">No ponds added yet.</p> : (
              <div className="pond-list">
                {ponds.map((pond) => {
                  const pondCycles = cycles.filter((cycle) => cycle.pond_id === pond.id)
                  return <article className="pond-list-item" key={pond.id}>
                    <span className="pond-list-icon">◌</span>
                    <div><strong>{pond.name}</strong><span>{pond.farm?.name}{pond.area_acres ? ` · ${pond.area_acres} acres` : ''}{pond.locality ? ` · ${pond.locality}` : ''}</span></div>
                    <div className="pond-cycle-list">{pondCycles.length ? pondCycles.map((cycle) => (
                      <div key={cycle.id} className="cycle-chip">
                        <span>{cycle.status === 'active' ? 'Active' : 'Completed'} · PL {cycle.pl ?? '—'} · {cycle.seed_stocked.toLocaleString()} stocked · {cycle.stocking_date}{cycle.completed_at ? ` · ended ${cycle.completed_at}` : ''}</span>
                        {cycle.status === 'active' && <Button type="button" className="farm-add-toggle" disabled={saving} onClick={() => void completeCycle(cycle.id)}>Mark completed</Button>}
                      </div>
                    )) : <span className="quiet-state">No cycle yet</span>}</div>
                    <div className="pond-location-edit">
                      <PondLocationPicker
                        key={`${pond.id}-${pond.latitude}-${pond.longitude}-${pond.locality}`}
                        initialValue={pond.latitude !== null && pond.longitude !== null
                          ? { label: pond.locality ?? `${pond.latitude.toFixed(4)}, ${pond.longitude.toFixed(4)}`, latitude: pond.latitude, longitude: pond.longitude }
                          : null}
                        onSelect={(location) => savePondLocation(pond.id, location)}
                      />
                    </div>
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
