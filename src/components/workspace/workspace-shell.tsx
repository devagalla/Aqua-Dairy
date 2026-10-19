'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Overview', glyph: '⌂' },
  { href: '/ponds', label: 'Ponds & cycles', glyph: '◉' },
  { href: '/health', label: 'Shrimp health', glyph: '✳' },
  { href: '/water', label: 'Water quality', glyph: '◌' },
  { href: '/feed', label: 'Feed log', glyph: '◈' },
  { href: '/growth', label: 'Growth', glyph: '↗' },
  { href: '/expenses', label: 'Expenses', glyph: '＄' },
  { href: '/alerts', label: 'Alerts', glyph: '◇' },
]

export function WorkspaceShell({
  children,
  email,
}: {
  children: ReactNode
  email: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  async function signOut() {
    setSigningOut(true)
    setSignOutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSignOutError(error.message)
      setSigningOut(false)
      return
    }
    router.replace('/auth/signin')
  }

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Link href="/dashboard" className="brand-lockup">
          <span className="brand-mark">a</span>
          <span>Aqua<span className="brand-light">Dairy</span></span>
        </Link>
        <div className="sidebar-caption">FARM MANAGEMENT</div>
        <nav className="workspace-nav" aria-label="Farm management">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`workspace-nav-link${active ? ' active' : ''}`}
              >
                <span className="nav-glyph" aria-hidden="true">{link.glyph}</span>
                {link.label}
                {active && <span className="nav-indicator" />}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-orbit" aria-hidden="true">✳</span>
            <strong>Every detail counts.</strong>
            <span>Better data, healthier ponds.</span>
          </div>
          <button
            className="profile-button"
            type="button"
            onClick={signOut}
            disabled={signingOut}
            title="Sign out"
          >
            <span className="profile-avatar">{email.charAt(0).toUpperCase() || 'F'}</span>
            <span className="profile-copy">
              <strong>{email.split('@')[0] || 'Farm account'}</strong>
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </span>
            <span className="profile-exit" aria-hidden="true">↗</span>
          </button>
          {signOutError && <p className="form-message error-message" role="alert">{signOutError}</p>}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <span className="topbar-eyebrow">YOUR FARM, IN FOCUS</span>
            <span className="topbar-date">
              {new Intl.DateTimeFormat('en', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </span>
          </div>
          <Link href="/ponds" className="topbar-setup">
            <span aria-hidden="true">＋</span> Ponds &amp; cycles
          </Link>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
      <nav className="mobile-workspace-nav" aria-label="Farm management">
        {links.slice(0, 5).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname.startsWith(link.href) ? 'active' : ''}
          >
            <span aria-hidden="true">{link.glyph}</span>
            {link.label === 'Water quality' ? 'Water' : link.label === 'Ponds & cycles' ? 'Ponds' : link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
