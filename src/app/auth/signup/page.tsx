'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [resent, setResent] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })
    setBusy(false)
    if (signupError) {
      setError(signupError.message)
      return
    }
    if (data.session) {
      window.location.assign('/onboarding')
      return
    }
    setSent(true)
  }

  async function resendEmail() {
    setBusy(true)
    setError('')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    })
    setBusy(false)
    if (resendError) setError(resendError.message)
    else setResent(true)
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <Link href="/" className="auth-brand"><span className="brand-mark">a</span>Aqua<span className="brand-light">Dairy</span></Link>
      <section className="auth-card animate-in">
        {sent ? (
          <div className="verify-state">
            <div className="verify-illustration" aria-hidden="true"><span>✉</span><i /><b /></div>
            <span className="eyebrow">ONE LAST STEP</span>
            <h1>Check your inbox.</h1>
            <p>We sent a verification link to <strong>{email}</strong>. Open it to confirm your email and we&apos;ll bring you straight back here to set up your farm.</p>
            <div className="verify-steps">
              <span><b>01</b> Open the email from Aqua Dairy</span>
              <span><b>02</b> Tap “Confirm your email”</span>
              <span><b>03</b> Add your farm, pond, and first cycle</span>
            </div>
            {resent ? <p className="success-message form-message" role="status">A fresh verification link is on its way.</p> : <button className="quiet-link" type="button" onClick={resendEmail} disabled={busy}>Didn&apos;t get the email? Send another</button>}
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            <p className="auth-switch">Already confirmed? <Link href="/auth/signin">Sign in</Link></p>
          </div>
        ) : (
          <>
            <span className="eyebrow">GROW WITH CLARITY</span>
            <h1>Your farm&apos;s next chapter.</h1>
            <p className="auth-intro">Create an account to bring your pond notes, cycles, and daily decisions together.</p>
            <form className="auth-form" onSubmit={submit}>
              <label className="field"><span>Email address</span><Input type="email" autoComplete="email" placeholder="you@yourfarm.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label className="field"><span>Create a password</span><Input type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><small>Use at least 8 characters.</small></label>
              {error && <p className="form-message error-message" role="alert">{error}</p>}
              <Button type="submit" className="button-primary submit-button" disabled={busy}>{busy ? 'Creating your account…' : 'Create my account'} <span aria-hidden="true">→</span></Button>
            </form>
            <p className="auth-switch">Already have an account? <Link href="/auth/signin">Sign in</Link></p>
          </>
        )}
      </section>
      <p className="auth-footnote">Thoughtful farm management, from first stocking to harvest.</p>
    </main>
  )
}
