'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { TurnstileCaptcha } from '@/components/auth/turnstile-captcha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

const isTestMode = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === 'true'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendNotice, setResendNotice] = useState('')
  const [resending, setResending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<TurnstileInstance>()

  // Test mode: auto-set captcha token
  useEffect(() => {
    if (isTestMode) {
      setCaptchaToken('playwright-test-token-' + Date.now())
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'error') {
      setError('That verification link could not be used. It may have expired. Sign in if your email is confirmed, or create a new verification email.')
    } else if (params.get('verified') === 'success') {
      setNotice('Email confirmed. Sign in to set up your farm.')
    }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // In test mode, skip captcha validation
    if (!isTestMode && !captchaToken) {
      setError('Complete the security check before signing in.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    setNeedsVerification(false)
    setResendNotice('')
    const { error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: isTestMode ? {} : { captchaToken },
    })
    captchaRef.current?.reset()
    setCaptchaToken('')
    if (signinError) {
      setError(signinError.message)
      setNeedsVerification(
        signinError.code === 'email_not_confirmed' ||
          signinError.message.toLowerCase().includes('email not confirmed'),
      )
      setBusy(false)
      return
    }
    const { data: farms, error: farmError } = await supabase.from('farms').select('id').limit(1)
    if (farmError) {
      setError(`You are signed in, but we could not load your farm: ${farmError.message}`)
      setBusy(false)
      return
    }
    const requestedNext = new URLSearchParams(window.location.search).get('next')
    const nextUrl = requestedNext?.startsWith('/')
      ? new URL(requestedNext, window.location.origin)
      : null
    const next = nextUrl?.origin === window.location.origin
      ? `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      : farms.length > 0 ? '/dashboard' : '/onboarding'
    window.location.assign(next)
  }

  async function resendVerification() {
    if (!captchaToken) {
      setError('Complete the security check before requesting another email.')
      return
    }
    setResending(true)
    setError('')
    setResendNotice('')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        captchaToken,
      },
    })
    captchaRef.current?.reset()
    setCaptchaToken('')
    setResending(false)
    if (resendError) setError(resendError.message)
    else {
      setResendNotice(
        'Verification request accepted. If this account still needs confirmation, check your inbox and spam folder.',
      )
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <Link href="/" className="auth-brand"><span className="brand-mark">a</span>Aqua<span className="brand-light">Dairy</span></Link>
      <section className="auth-card animate-in">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Good to have you back.</h1>
        <p className="auth-intro">Your ponds have a story to tell. Pick up right where you left off.</p>
        <span className="telugu-subtitle" lang="te">మీ చెరువు వివరాలు కొనసాగించడానికి మీ ఖాతాలోకి ప్రవేశించండి.</span>
        {notice && <p className="form-message success-message" role="status">{notice}</p>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field"><span>Email address</span><Input type="email" autoComplete="email" placeholder="you@yourfarm.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><span className="telugu-hint" lang="te">ఖాతా తెరిచేటప్పుడు వాడిన ఈమెయిల్ నమోదు చేయండి.</span></label>
          <label className="field"><span>Password</span><Input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><span className="telugu-hint" lang="te">మీ ఖాతా పాస్‌వర్డ్ నమోదు చేయండి.</span></label>
          <TurnstileCaptcha captchaRef={captchaRef} onToken={setCaptchaToken} />
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          {needsVerification && (
            <button
              className="quiet-link resend-signin-link"
              type="button"
              onClick={resendVerification}
              disabled={resending || !email || (!isTestMode && !captchaToken)}
            >
              {resending ? 'Requesting a link…' : 'Resend verification email'}
            </button>
          )}
          {resendNotice && <p className="form-message success-message" role="status">{resendNotice}</p>}
          <Button type="submit" className="button-primary submit-button" disabled={busy || (!isTestMode && !captchaToken)}>{busy ? 'Signing you in…' : 'Sign in to your farm'} <span aria-hidden="true">→</span></Button>
        </form>
        <p className="auth-switch">New to Aqua Dairy? <Link href="/auth/signup">Create an account</Link></p>
      </section>
      <p className="auth-footnote">Thoughtful farm management, from first stocking to harvest.</p>
    </main>
  )
}
