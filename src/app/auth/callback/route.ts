import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const requestedNext = url.searchParams.get('next')
  const nextUrl = requestedNext?.startsWith('/')
    ? new URL(requestedNext, url.origin)
    : null
  const next =
    nextUrl?.origin === url.origin
      ? `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      : '/onboarding'
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('The verification link is incomplete or expired.') }

  if (error) {
    return NextResponse.redirect(new URL('/auth/signin?verified=error', url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
