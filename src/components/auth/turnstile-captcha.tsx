'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useState, type RefObject, useEffect, useRef } from 'react'

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const isTestMode = process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === 'true'

export function TurnstileCaptcha({
  captchaRef,
  onToken,
}: {
  captchaRef: RefObject<TurnstileInstance | undefined>
  onToken: (token: string) => void
}) {
  const [widgetError, setWidgetError] = useState('')
  const tokenCalled = useRef(false)

  // Test mode: auto-generate a valid token for E2E tests and skip Turnstile entirely
  useEffect(() => {
    if (isTestMode && !tokenCalled.current) {
      tokenCalled.current = true
      const testToken = 'playwright-test-token-fixed'
      onToken(testToken)
    }
  }, [isTestMode, onToken])

  if (isTestMode) {
    return null // Test mode - token auto-generated above, no UI needed
  }

  if (!siteKey) {
    return (
      <p className="form-message error-message" role="alert">
        CAPTCHA isn&apos;t configured yet. Add the Cloudflare Turnstile site key to the app environment.
      </p>
    )
  }

  return (
    <div className="turnstile-captcha">
      <Turnstile
        ref={captchaRef}
        siteKey={siteKey}
        onSuccess={(token) => {
          setWidgetError('')
          onToken(token)
        }}
        onExpire={() => {
          setWidgetError('The security check expired. Complete it again to continue.')
          onToken('')
        }}
        onError={() => {
          setWidgetError('The security check could not load. Check the Turnstile hostname allowlist and confirm Supabase has the secret from this same widget.')
          onToken('')
        }}
        scriptOptions={{
          onError: () => {
            setWidgetError('Could not load Cloudflare Turnstile. Check your connection and try again.')
            onToken('')
          },
        }}
      />
      {widgetError && <span className="form-message error-message" role="alert">{widgetError}</span>}
      <span className="telugu-hint" lang="te">దయచేసి భద్రతా తనిఖీ పూర్తి చేయండి.</span>
    </div>
  )
}