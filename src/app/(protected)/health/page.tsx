import { ShrimpHealthScreening } from '@/components/workspace/shrimp-health-screening'

export default function ShrimpHealthPage() {
  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">SHRIMP HEALTH</span>
          <h1>Photo screening</h1>
          <p>Use your trained image model as an early visual check, alongside your farm observations.</p>
          <span className="telugu-subtitle" lang="te">మీ పరిశీలనలకు తోడుగా రొయ్యల ఫోటోను ప్రాథమికంగా పరీక్షించండి.</span>
        </div>
        <span className="heading-orbit" aria-hidden="true">✳</span>
      </div>
      <ShrimpHealthScreening />
    </div>
  )
}
