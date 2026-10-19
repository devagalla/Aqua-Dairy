'use client'

export default function PondLogPage() {
  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">POND LOG</span>
          <h1>Pond conditions &amp; daily log</h1>
          <p>Review pond water parameters, feed, and growth records in one place.</p>
          <span className="telugu-subtitle" lang="te">చెరువు పరిస్థితులు మరియు రోజువారీ నమోదులను ఇక్కడ సమీక్షించండి.</span>
        </div>
        <span className="heading-orbit" aria-hidden="true">◉</span>
      </div>

      <div className="card-surface">
        <GrowthTracker />
      </div>
    </div>
  )
}
