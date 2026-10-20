'use client'

import { useState, useEffect } from 'react'
import { projectPrice, type Trend, type CountSize } from '@/utils/pricePrediction'
import { fetchMarketPrice, priceRegistry, type PriceDataPoint } from '@/lib/price-providers'

type PriceHistoryEntry = { pricePerKg: number; date: string }
type PriceHistory = Record<string, PriceHistoryEntry[]> // Key: region-countSize

interface PriceData {
  id: string
  region: string
  countSize: CountSize
  pricePerKg: number
  trend: Trend
  date: string
  note?: string
  source?: string // 'manual' | 'fao' | 'mpeda' | etc.
  externalId?: string
}

const COUNT_SIZES: CountSize[] = [30, 40, 50, 60, 70, 80, 90, 100]
const REGIONS = ['Bhimavaram', 'Nellore', 'Surat', 'Ongole', 'Kakinada']

export default function MarketPriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('Bhimavaram')
  const [isStale, setIsStale] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)

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
        ? { ...p, pricePerKg: newPrice, trend, date: today, note, source: 'manual' }
        : p
    )
    setPrices(updatedPrices)
    localStorage.setItem('marketPrices', JSON.stringify(updatedPrices))
    setIsStale(false)
  }

  const handleFetchExternalPrices = async () => {
    setIsFetching(true)
    setFetchError(null)

    try {
      // Try to fetch from all providers for the selected region
      const results = await priceRegistry.fetchFromAll(selectedRegion, 50) // sample count size

      // For each count size, try to get data
      const newPrices: PriceData[] = []
      const today = new Date().toISOString().split('T')[0]

      for (const countSize of COUNT_SIZES) {
        const fetchResult = await priceRegistry.fetchPrices(selectedRegion, countSize)
        if (fetchResult.success && fetchResult.data && fetchResult.data.length > 0) {
          // Use the first (highest priority) result
          const extPrice = fetchResult.data[0]

          // Check if we already have a manual entry for this
          const existingIndex = prices.findIndex(
            p => p.region === selectedRegion && p.countSize === countSize && p.source === 'manual'
          )

          if (existingIndex >= 0) {
            // Keep manual entry, but we could show external as reference
            continue
          }

          // Add external price entry
          newPrices.push({
            id: `ext-${fetchResult.provider}-${selectedRegion}-${countSize}-${today}`,
            region: selectedRegion,
            countSize,
            pricePerKg: extPrice.pricePerKg,
            trend: 'stable', // External data doesn't have trend
            date: extPrice.date,
            note: `Auto-fetched from ${fetchResult.provider}`,
            source: fetchResult.provider,
            externalId: extPrice.metadata?.faoMarket as string || undefined,
          })
        }
      }

      if (newPrices.length > 0) {
        const updated = [...prices, ...newPrices]
        setPrices(updated)
        localStorage.setItem('marketPrices', JSON.stringify(updated))
        setLastFetchTime(new Date().toISOString())
        setIsStale(false)
      } else {
        setFetchError('No external price data available for this region. Try a different region or check back later.')
      }
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch external prices')
    } finally {
      setIsFetching(false)
    }
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Market Prices</h3>
          <button
            onClick={handleFetchExternalPrices}
            disabled={isFetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isFetching ? 'Fetching...' : '🌐 Fetch from FAO'}
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Enter today's prices per kg by region. Count sizes from 30 to 100.
          {' '}
          <span className="text-blue-600">Click "Fetch from FAO" to auto-populate from global fisheries data.</span>
        </p>

        {fetchError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-4">
            <p className="text-red-800 text-sm">{fetchError}</p>
          </div>
        )}

        {lastFetchTime && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">Last external sync: {new Date(lastFetchTime).toLocaleString()}</p>
          </div>
        )}

        {isStale && (
          <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg mb-4">
            <p className="text-amber-800 font-medium">⚠ Prices may be old (last updated {">"}3 days ago)</p>
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
              <th className="text-left p-3 font-semibold">Source</th>
              <th className="text-left p-3 font-semibold">Trend</th>
              <th className="text-left p-3 font-semibold">Projection (7d)</th>
            </tr>
          </thead>
          <tbody>
            {COUNT_SIZES.map(count => {
              const priceData = filteredPrices.find(p => p.countSize === count)
              const projection = priceData ? getProjection(selectedRegion, count) : null
              const isExternal = priceData?.source && priceData.source !== 'manual'
              return (
                <tr key={count} className={`border-b border-gray-200 ${isExternal ? 'bg-blue-50' : ''}`}>
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
                  <td className="p-3 text-sm">
                    {priceData?.source === 'manual' ? (
                      <span className="text-green-600 font-medium">✎ Manual</span>
                    ) : priceData?.source ? (
                      <span className="text-blue-600 font-medium">🌐 {priceData.source.toUpperCase()}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
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
                    {projection && projection.delta !== null && projection.projectedPrice !== null ? (
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
          <p>No prices yet. Add today's prices above or fetch from FAO.</p>
        </div>
      )}
    </div>
  )
}