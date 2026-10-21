'use client'

import { useState, useEffect } from 'react'

interface FeedRecord {
  timestamp: string
  trayNumber: number
  feedAdjustmentPercent: number
  recommendation: string
}

export default function FeedTraysPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<FeedRecord[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('feedRecords')
    if (saved) {
      setRecords(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  if (loading) {
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
        <p className="quiet-state">Loading…</p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">FEED &amp; CHECK TRAYS</span>
          <h1>Daily feeding &amp; tray checks</h1>
          <p>Record feed and check tray observations. Intelligent feed adjustments are calculated in real time.</p>
          <span className="telugu-subtitle" lang="te">మేత మరియు ట్రే పరిశీలనలను ఇక్కడ నమోదు చేయండి. సరైన మేత సర్దుబాట్లు ఇక్కడ లెక్కించబడతాయి.</span>
        </div>
        <span className="heading-orbit" aria-hidden="true">◈</span>
      </div>

      <div className="card-surface">
        <h3>Feed &amp; Trays Workspace</h3>
        {records.length === 0 ? (
          <p className="text-center py-4 text-gray-600">No feed records yet. Add your first observation above.</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-semibold">Time</th>
                    <th className="text-left p-3 font-semibold">Tray</th>
                    <th className="text-left p-3 font-semibold">Adjustment</th>
                    <th className="text-left p-3 font-semibold">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(-10).reverse().map((record, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3">{record.trayNumber}</td>
                      <td className="p-3">
                        <span className={record.feedAdjustmentPercent < 0 ? 'text-red-600' : record.feedAdjustmentPercent > 0 ? 'text-green-600' : 'text-gray-600'}>
                          {record.feedAdjustmentPercent}%
                        </span>
                      </td>
                      <td className="p-3 text-sm">{record.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-gray-500 mt-2">
                Showing last {Math.min(10, records.length)} of {records.length} records
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}