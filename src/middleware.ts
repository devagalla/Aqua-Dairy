import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/water/:path*',
    '/feed/:path*',
    '/growth/:path*',
    '/expenses/:path*',
    '/ponds/:path*',
    '/alerts/:path*',
    '/onboarding/:path*',
    '/api/water/:path*',
  ],
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return response
}
