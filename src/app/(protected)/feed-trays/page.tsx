'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { evaluateFeedDecision } from '@/utils/feedDecision'

export default function FeedTraysPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">FEED &amp; CHECK TRAYS</span>
          <h1>Daily feeding &amp; tray checks</h1>
          <p>Record feed and check tray observations. Intelligent feed adjustments are calculated in real time.</p>
        </div>
        <span className="heading-orbit" aria-hidden="true">◈</span>
      </div>

      {loading ? (
        <p className="quiet-state">Loading…</p>
      ) : (
        <div className="card-surface">
          <h3>Feed &amp; Trays workspace</h3>
          <p>This tab is under construction. The interactive feed logging form with tray check sliders and feed decision calculator will be connected here.</p>
          <p>Utilities used: <code>evaluateFeedDecision</code>, <code>calculateAverageLeftover</code>, <code>queueOfflineRecord</code>.</p>
        </div>
      )}
    </div>
  )
}
