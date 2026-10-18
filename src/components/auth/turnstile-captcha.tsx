'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import type { RefObject } from 'react'

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export function TurnstileCaptcha({
  captchaRef,
  onToken,
}: {
  captchaRef: RefObject<TurnstileInstance | undefined>
  onToken: (token: string) => void
}) {
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
        onSuccess={onToken}
        onExpire={() => onToken('')}
        onError={() => onToken('')}
      />
      <span className="telugu-hint" lang="te">దయచేసి భద్రతా తనిఖీ పూర్తి చేయండి.</span>
    </div>
  )
}
