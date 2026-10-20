'use client'

import { useState, useEffect } from 'react'
import { useGrossCropValue } from '@/hooks/useGrossCropValue'
import { projectPrice, type Trend, type CountSize } from '@/utils/pricePrediction'

type PriceHistoryEntry = { pricePerKg: number; date: string }
type PriceHistory = Record<string, PriceHistoryEntry[]> // Key: region-countSize

// ... inside component ...
  const [prices, setPrices] = useState<PriceData[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({})

interface PriceData {
  id: string
  region: string
  countSize: CountSize
  pricePerKg: number
  trend: Trend
  date: string
  note?: string
}

const COUNT_SIZES: CountSize[] = [30, 40, 50, 60, 70, 80, 90, 100]
const REGIONS = ['Bhimavaram', 'Nellore', 'Surat', 'Ongole', 'Kakinada']

export default function MarketPriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('Bhimavaram')
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('marketPrices')
    const parsed = saved ? JSON.parse(saved) : []
    setPrices(parsed)

    // Check for staleness
    if (parsed.length > 0) {
      const latestDate = new Date(Math.max(...parsed.map((p: PriceData) => new Date(p.date).getTime())))
      const daysDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
      setIsStale(daysDiff > 3)
    }
  }, [])

  const handlePriceUpdate = (countSize: CountSize, newPrice: number, trend: Trend, note?: string) => {
    const today = new Date().toISOString().split('T')[0]
    const updatedPrices = prices.map(p =>
      (p.countSize === countSize && p.region === selectedRegion)
        ? { ...p, pricePerKg: newPrice, trend, date: today, note }
        : p
    )
    setPrices(updatedPrices)
    localStorage.setItem('marketPrices', JSON.stringify(updatedPrices))
    setIsStale(false)
  }

  const getProjection = (region: string, countSize: CountSize) => {
    const history = prices
      .filter(p => p.region === region && p.countSize === countSize)
      .map(p => ({ pricePerKg: p.pricePerKg, date: p.date }))

    const current = prices.find(p => p.region === region && p.countSize === countSize)
    if (!current) return null

    return projectPrice(current.pricePerKg, history, current.trend, 7)
  }

  const filteredPrices = prices.filter(p => p.region === selectedRegion)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Market Prices</h3>
        <p className="text-gray-600 mb-4">
          Enter today's prices per kg by region. Count sizes from 30 to 100.
        </p>
        
        {isStale && (
          <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg mb-4">
            <p className="text-amber-800 font-medium">⚠ Prices may be old (last updated &gt;3 days ago)</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Region</label>
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
        >
          {REGIONS.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-3 font-semibold">Count Size</th>
              <th className="text-left p-3 font-semibold">Price / kg (INR)</th>
              <th className="text-left p-3 font-semibold">Trend</th>
              <th className="text-left p-3 font-semibold">Projection (7d)</th>
            </tr>
          </thead>
          <tbody>
            {COUNT_SIZES.map(count => {
              const priceData = filteredPrices.find(p => p.countSize === count)
              const projection = priceData ? getProjection(selectedRegion, count) : null
              return (
                <tr key={count} className="border-b border-gray-200">
                  <td className="p-3 font-medium">{count} count</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={priceData?.pricePerKg || ''}
                      onChange={(e) => {
                        if (priceData) {
                          handlePriceUpdate(count, parseFloat(e.target.value) || 0, priceData.trend, priceData.note)
                        }
                      }}
                      className="w-32 min-h-[56px] p-3 border border-gray-300 rounded text-lg"
                      placeholder="Enter price"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={priceData?.trend || 'stable'}
                      onChange={(e) => {
                        if (priceData) {
                          handlePriceUpdate(count, priceData.pricePerKg, e.target.value as Trend, priceData.note)
                        }
                      }}
                      className="min-h-[56px] p-3 border border-gray-300 rounded text-lg"
                    >
                      <option value="up">🟢 Upward</option>
                      <option value="stable">🟡 Stable</option>
                      <option value="down">🔴 Downward</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {projection ? (
                      <div className="text-sm">
                        <p className={`font-semibold ${projection.delta > 0 ? 'text-green-600' : projection.delta < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          ₹{projection.projectedPrice.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500 italic truncate max-w-[120px]" title={projection.advice}>
                          {projection.advice}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Log 3+ days</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {prices.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <p>No prices yet. Add today's prices above.</p>
        </div>
      )}
    </div>
  )
}