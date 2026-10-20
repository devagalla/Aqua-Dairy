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
    const parsed: PriceData[] = saved ? JSON.parse(saved) : []
    setPrices(parsed)

    // Check for staleness
    if (parsed.length > 0) {
      const latestDate = new Date(Math.max(...parsed.map((p: PriceData) => new Date(p.date).getTime())))
      const daysDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
      setIsStale(daysDiff > 3)
    }

    // Auto-fetch prices if region doesn't have prices or if stale
    const regionPrices = parsed.filter(p => p.region === selectedRegion)
    if (regionPrices.length === 0) {
      fetchExternalPricesForRegion(selectedRegion, parsed)
    }
  }, [selectedRegion])

  const fetchExternalPricesForRegion = async (region: string, currentPrices: PriceData[]) => {
    setIsFetching(true)
    setFetchError(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      const updatedList = [...currentPrices]

      for (const countSize of COUNT_SIZES) {
        const fetchResult = await priceRegistry.fetchPrices(region, countSize)
        if (fetchResult.success && fetchResult.data && fetchResult.data.length > 0) {
          const extPrice = fetchResult.data[0]

          const existingIdx = updatedList.findIndex(
            p => p.region === region && p.countSize === countSize
          )

          // Only overwrite if it doesn't exist or is not a manual entry
          if (existingIdx === -1) {
            updatedList.push({
              id: `ext-${fetchResult.provider}-${region}-${countSize}-${today}`,
              region,
              countSize,
              pricePerKg: extPrice.pricePerKg,
              trend: 'stable',
              date: extPrice.date,
              note: `Auto-fetched from ${fetchResult.provider}`,
              source: fetchResult.provider,
              externalId: extPrice.metadata?.faoMarket as string || undefined,
            })
          } else if (updatedList[existingIdx].source !== 'manual') {
            updatedList[existingIdx] = {
              ...updatedList[existingIdx],
              pricePerKg: extPrice.pricePerKg,
              source: fetchResult.provider,
              date: extPrice.date,
            }
          }
        }
      }

      setPrices(updatedList)
      localStorage.setItem('marketPrices', JSON.stringify(updatedList))
      setLastFetchTime(new Date().toISOString())
      setIsStale(false)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch external prices')
    } finally {
      setIsFetching(false)
    }
  }

  const handlePriceUpdate = (countSize: CountSize, newPrice: number, trend: Trend, note?: string) => {
    const today = new Date().toISOString().split('T')[0]
    const existingIndex = prices.findIndex(p => p.countSize === countSize && p.region === selectedRegion)
    let updatedPrices: PriceData[]

    if (newPrice === 0) {
      // If cleared or zero, remove entry so farmer can re-fetch
      updatedPrices = prices.filter(p => !(p.countSize === countSize && p.region === selectedRegion))
    } else if (existingIndex >= 0) {
      // Update existing entry
      updatedPrices = prices.map((p, i) =>
        i === existingIndex ? { ...p, pricePerKg: newPrice, trend, date: today, note, source: 'manual' } : p
      )
    } else {
      // Create new entry
      updatedPrices = [
        ...prices,
        {
          id: `manual-${selectedRegion}-${countSize}-${today}`,
          region: selectedRegion,
          countSize,
          pricePerKg: newPrice,
          trend,
          date: today,
          note,
          source: 'manual',
        }
      ]
    }

    setPrices(updatedPrices)
    localStorage.setItem('marketPrices', JSON.stringify(updatedPrices))
    setIsStale(false)
  }

  const handleFetchExternalPrices = async () => {
    await fetchExternalPricesForRegion(selectedRegion, prices)
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
                        const value = parseFloat(e.target.value) || 0
                        if (priceData) {
                          // Update existing entry
                          handlePriceUpdate(count, value, priceData.trend, priceData.note)
                        } else if (value > 0) {
                          // Create new entry with default trend
                          handlePriceUpdate(count, value, 'stable')
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