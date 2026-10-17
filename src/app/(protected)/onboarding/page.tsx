'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function createFarm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setSaving(true)
    setError('')

    try {
      const { error: setupError } = await supabase.rpc('create_initial_farm', {
        farm_name_input: String(values.get('farm_name')).trim(),
        region_input: String(values.get('region')).trim() || null,
        pond_name_input: String(values.get('pond_name')).trim(),
        area_acres_input: values.get('area_acres') ? Number(values.get('area_acres')) : null,
        seed_stocked_input: Number(values.get('seed_stocked')),
        stocking_date_input: String(values.get('stocking_date')),
        pl_input: String(values.get('pl')).trim() || null,
        target_harvest_days_input: values.get('target_harvest_days')
          ? Number(values.get('target_harvest_days'))
          : null,
      })
      if (setupError) throw setupError
      form.reset()
      router.replace('/dashboard')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not finish farm setup.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">LET&apos;S GET YOU STARTED</span>
          <h1>Make this farm yours.</h1>
          <p>Add your farm, a pond, and its current cycle. After that, logs will already know where they belong.</p>
        </div>
        <span className="heading-orbit" aria-hidden="true">✳</span>
      </div>
      <section className="card-surface onboarding-card animate-in animate-delay">
        <div className="onboarding-steps">
          <span className="onboarding-step active"><b>01</b><span>Farm</span></span>
          <i />
          <span className="onboarding-step active"><b>02</b><span>Pond</span></span>
          <i />
          <span className="onboarding-step active"><b>03</b><span>Cycle</span></span>
        </div>
        <form onSubmit={createFarm} className="onboarding-form">
          <div className="form-section-title"><span className="onboarding-form-icon">⌂</span><div><strong>Your farm</strong><span>A name and location to make it feel like home.</span></div></div>
          <div className="field-grid">
            <label className="field"><span>Farm name</span><Input name="farm_name" placeholder="e.g. Bluewater Farms" required minLength={2} /></label>
            <label className="field"><span>Region <small>Optional</small></span><Input name="region" placeholder="e.g. Andhra Pradesh" /></label>
          </div>
          <div className="form-section-title"><span className="onboarding-form-icon sea">◌</span><div><strong>Your first pond</strong><span>We&apos;ll use this as the home for your first growing cycle.</span></div></div>
          <div className="field-grid">
            <label className="field"><span>Pond name</span><Input name="pond_name" placeholder="e.g. Pond 01" required minLength={1} /></label>
            <label className="field"><span>Area in acres <small>Optional</small></span><Input name="area_acres" type="number" min="0.01" step="0.01" placeholder="1.5" /></label>
          </div>
          <div className="form-section-title"><span className="onboarding-form-icon green">↗</span><div><strong>Current culture cycle</strong><span>Link every water, feed, and growth log to a real cycle.</span></div></div>
          <div className="field-grid">
            <label className="field"><span>Seed stock (count)</span><Input name="seed_stocked" type="number" min="1" step="1" placeholder="50000" required /></label>
            <label className="field"><span>Stocking date</span><Input name="stocking_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
            <label className="field"><span>PL stage <small>Optional</small></span><Input name="pl" placeholder="e.g. PL12" /></label>
            <label className="field"><span>Target cycle length (days) <small>Optional</small></span><Input name="target_harvest_days" type="number" min="1" step="1" placeholder="120" /></label>
          </div>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <Button type="submit" className="button-primary submit-button" disabled={saving}>
            {saving ? 'Setting up your farm…' : 'Create my farm'} <span aria-hidden="true">→</span>
          </Button>
          <p className="form-footnote">You can add more ponds and cycles any time. Your records stay private to your farm.</p>
        </form>
      </section>
    </div>
  )
}
