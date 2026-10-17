'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Overview = {
  farmName: string
  pondCount: number
  cycleCount: number
  latestWater: { ph: number | null; do_mg_l: number | null; logged_at: string } | null
  latestGrowth: { average_weight_g: number; sampled_at: string } | null
  totalFeed: number
  totalExpenses: number
  error: string
  loading: boolean
}

const shortcuts = [
  { href: '/water', title: 'Water quality', copy: 'Check what your pond is telling you.', glyph: '◌', tint: 'aqua' },
  { href: '/feed', title: 'Feed log', copy: 'Keep daily feedings on track.', glyph: '◈', tint: 'green' },
  { href: '/growth', title: 'Growth samples', copy: 'Follow weight gain over time.', glyph: '↗', tint: 'violet' },
  { href: '/expenses', title: 'Farm expenses', copy: 'Understand where costs go.', glyph: '＄', tint: 'amber' },
]

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview>({
    farmName: '',
    pondCount: 0,
    cycleCount: 0,
    latestWater: null,
    latestGrowth: null,
    totalFeed: 0,
    totalExpenses: 0,
    error: '',
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [farms, ponds, cycles, water, growth, feed, expenses] = await Promise.all([
        supabase.from('farms').select('name').order('created_at').limit(1),
        supabase.from('ponds').select('id', { count: 'exact', head: true }),
        supabase.from('culture_cycles').select('id', { count: 'exact', head: true }),
        supabase.from('water_logs').select('ph, do_mg_l, logged_at').order('logged_at', { ascending: false }).limit(1),
        supabase.from('growth_samples').select('average_weight_g, sampled_at').order('sampled_at', { ascending: false }).limit(1),
        supabase.from('feed_logs').select('amount_kg'),
        supabase.from('expenses').select('amount'),
      ])
      const failed = [farms, ponds, cycles, water, growth, feed, expenses].find((result) => result.error)
      if (cancelled) return
      if (failed?.error) {
        setOverview((value) => ({ ...value, error: failed.error.message, loading: false }))
        return
      }
      setOverview({
        farmName: farms.data?.[0]?.name ?? '',
        pondCount: ponds.count ?? 0,
        cycleCount: cycles.count ?? 0,
        latestWater: water.data?.[0] ?? null,
        latestGrowth: growth.data?.[0] ?? null,
        totalFeed: (feed.data ?? []).reduce((sum, row) => sum + Number(row.amount_kg), 0),
        totalExpenses: (expenses.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0),
        error: '',
        loading: false,
      })
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="page-stack">
      <section className="dashboard-hero animate-in">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="status-pulse" /> YOUR FARM AT A GLANCE</span>
          <h1>{overview.farmName ? `Good to see you at ${overview.farmName}.` : 'A clearer view of your farm starts here.'}</h1>
          <p>Small observations today make stronger harvests tomorrow.</p>
          <Link href="/ponds" className="hero-action">Manage ponds &amp; cycles <span aria-hidden="true">→</span></Link>
        </div>
        <div className="hero-pond-art" aria-hidden="true">
          <span className="pond-sun" />
          <span className="pond-ripple ripple-one" />
          <span className="pond-ripple ripple-two" />
          <span className="pond-ripple ripple-three" />
          <span className="pond-leaf leaf-one">⌁</span>
          <span className="pond-leaf leaf-two">⌁</span>
          <span className="hero-fish">◁</span>
          <span className="hero-fish fish-two">◁</span>
          <span className="water-label">POND 01&nbsp; · &nbsp;IN SEASON</span>
        </div>
      </section>

      {overview.error && <p className="form-message error-message" role="alert">{overview.error}</p>}

      <section className="stats-grid" aria-label="Farm summary">
        <article className="stat-card animate-in animate-delay">
          <span className="stat-label">Active ponds</span>
          <strong>{overview.loading ? '—' : overview.pondCount.toString().padStart(2, '0')}</strong>
          <span className="stat-note">across your farm</span>
          <span className="stat-sparkline aqua-spark" aria-hidden="true">⌁⌁⌁</span>
        </article>
        <article className="stat-card animate-in animate-delay-2">
          <span className="stat-label">Culture cycles</span>
          <strong>{overview.loading ? '—' : overview.cycleCount.toString().padStart(2, '0')}</strong>
          <span className="stat-note">growing right now</span>
          <span className="stat-sparkline green-spark" aria-hidden="true">⌁⌁⌁</span>
        </article>
        <article className="stat-card animate-in animate-delay-3">
          <span className="stat-label">Latest pH</span>
          <strong>{overview.loading ? '—' : overview.latestWater?.ph ?? '—'}</strong>
          <span className="stat-note">{overview.latestWater ? `checked ${new Date(overview.latestWater.logged_at).toLocaleDateString()}` : 'add your first water reading'}</span>
          <span className="stat-sparkline violet-spark" aria-hidden="true">⌁⌁⌁</span>
        </article>
        <article className="stat-card animate-in animate-delay-4">
          <span className="stat-label">Average weight</span>
          <strong>{overview.loading ? '—' : overview.latestGrowth ? `${overview.latestGrowth.average_weight_g}g` : '—'}</strong>
          <span className="stat-note">{overview.latestGrowth ? 'latest sample' : 'log a growth sample'}</span>
          <span className="stat-sparkline amber-spark" aria-hidden="true">⌁⌁⌁</span>
        </article>
      </section>

      <section className="section-heading">
        <div><span className="eyebrow">A GOOD DAY STARTS WITH A GOOD LOG</span><h2>What would you like to record?</h2></div>
        <span className="section-meta">YOUR DAILY TOOLS&nbsp; ↘</span>
      </section>
      <section className="shortcut-grid">
        {shortcuts.map((item, index) => (
          <Link href={item.href} key={item.href} className={`shortcut-card shortcut-${item.tint} animate-in animate-delay-${Math.min(index + 1, 4)}`}>
            <span className="shortcut-glyph" aria-hidden="true">{item.glyph}</span>
            <span className="shortcut-arrow" aria-hidden="true">↗</span>
            <strong>{item.title}</strong>
            <span>{item.copy}</span>
          </Link>
        ))}
      </section>

      <section className="dashboard-bottom-grid">
        <article className="card-surface dashboard-insight">
          <div className="card-heading"><div><span className="eyebrow">POND HEALTH</span><h2>Latest water reading</h2></div><span className="insight-glyph">◌</span></div>
          {overview.latestWater ? (
            <div className="reading-row">
              <div><span className="reading-number">{overview.latestWater.ph ?? '—'}</span><span className="reading-unit">pH</span></div>
              <div><span className="reading-number">{overview.latestWater.do_mg_l ?? '—'}</span><span className="reading-unit">mg/L oxygen</span></div>
              <span className="reading-date">{new Date(overview.latestWater.logged_at).toLocaleString()}</span>
            </div>
          ) : <p className="quiet-state">No readings yet. Add the first water check to start a useful pond history.</p>}
          <Link href="/water" className="text-link">Log water quality <span aria-hidden="true">→</span></Link>
        </article>
        <article className="card-surface dashboard-insight">
          <div className="card-heading"><div><span className="eyebrow">KEEP MOMENTUM</span><h2>Your farm journal</h2></div><span className="insight-glyph warm">✳</span></div>
          <p className="quiet-state">Record feed, growth, and expenses as they happen. Your entries will build a history you can act on.</p>
          <Link href="/feed" className="text-link">Add a feeding <span aria-hidden="true">→</span></Link>
        </article>
      </section>
    </div>
  )
}
