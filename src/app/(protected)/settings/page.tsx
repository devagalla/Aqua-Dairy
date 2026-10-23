'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TeluguHint } from '@/components/ui/telugu-hint'
import { supabase } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState({ firstName: '', lastName: '', farmName: '', language: 'en' as 'en'|'te', phone: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [p, s, f] = await Promise.all([
      supabase.from('profiles').select('full_name, farmer_name').eq('id', user.id).maybeSingle(),
      supabase.from('settings').select('language').eq('user_id', user.id).maybeSingle(),
      supabase.from('farms').select('name').order('created_at').limit(1)
    ])
    const n = p.data?.full_name?.split(' ') || []
    setProfile({ firstName: p.data?.farmer_name || n[0] || '', lastName: n.slice(1).join(' ') || '', farmName: f.data?.[0]?.name || '', language: s.data?.language || 'en', phone: '' })
    setLoading(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }
    try {
      const full = `${profile.firstName} ${profile.lastName}`.trim()
      await supabase.from('profiles').upsert({ id: user.id, full_name: full, farmer_name: profile.firstName })
      await supabase.from('settings').upsert({ user_id: user.id, language: profile.language })
      setSuccess('Profile saved'); setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="page-stack"><section className="card-surface"><p className="quiet-state">Loading...</p></section></div>

  return (
    <div className="page-stack">
      <div className="page-heading animate-in"><div>
        <span className="eyebrow">PERSONALIZE YOUR EXPERIENCE</span>
        <h1>Settings</h1>
        <p>Update your profile and preferences.</p>
        <span className="telugu-subtitle" lang="te">మీ ప్రొఫైల్ మరియు ప్రాధాన్యతలను నవీకరించండి.</span>
      </div></div>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {success && <p className="form-message success-message" role="status">{success}</p>}
      <section className="card-surface record-form-card animate-in animate-delay">
        <form onSubmit={save} className="record-form">
          <div className="field-grid">
            <label className="field"><span>First Name</span><Input name="firstName" value={profile.firstName} onChange={e=>setProfile({...profile,firstName:e.target.value})} placeholder="Your first name" required /></label>
            <label className="field"><span>Last Name</span><Input name="lastName" value={profile.lastName} onChange={e=>setProfile({...profile,lastName:e.target.value})} placeholder="Your last name" /></label>
          </div>
          <div className="field-grid">
            <label className="field"><span>Farm Name</span><Input name="farmName" value={profile.farmName} onChange={e=>setProfile({...profile,farmName:e.target.value})} placeholder="Your farm name" /><TeluguHint>మీ ఫారం పేరు.</TeluguHint></label>
            <label className="field"><span>Phone</span><Input name="phone" type="tel" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="+91 XXXXX XXXXX" /></label>
          </div>
          <label className="field"><span>Language</span><select value={profile.language} onChange={e=>setProfile({...profile,language:e.target.value as 'en'|'te'})}><option value="en">English</option><option value="te">తెలుగు (Telugu)</option></select><TeluguHint>భాష ఎంచుకోండి.</TeluguHint></label>
          <Button type="submit" className="button-primary submit-button" disabled={saving}>{saving?'Saving...':'Save Profile'}</Button>
        </form>
      </section>
      <section className="card-surface record-form-card animate-in animate-delay-2">
        <div className="card-heading"><div><span className="eyebrow">ACCOUNT</span><h2>Sign Out</h2></div></div>
        <p className="quiet-state">Sign out. You'll need to sign in again.</p>
        <Button type="button" onClick={()=>supabase.auth.signOut().then(()=>router.replace('/auth/signin'))} className="button-secondary" style={{marginTop:12}}>Sign Out</Button>
      </section>
    </div>
  )
}