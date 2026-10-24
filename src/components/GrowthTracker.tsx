'use client'

import { useState, useMemo, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { calculateADG, detectStuntedGrowth, calculateBiomassKg } from '@/utils/growthMath'
import { estimateHarvestCount, nearestCountTier, projectPrice, type PriceProjection } from '@/utils/pricePrediction'
import { fetchMarketPrice, priceRegistry } from '@/lib/price-providers'
import benchmarksData from '@/data/shrimpGrowthBenchmarks.json'

interface Benchmark {
  doc: number
  expected_abw_g: number
}
const benchmarks: Benchmark[] = benchmarksData as Benchmark[]

interface PondConfig {
  pondName: string
  stockingDate: string
  seedCount: number
  pondAreaAcres: number
  targetHarvestCount?: number | null
}

interface SamplingRecord {
  doc: number
  mbwGrams: number
  cumulativeFeedKg: number
  survivalPercent: number
}

import { useFarm } from '@/contexts/farm-context'

export default function GrowthTracker() {
  const { activePond, ponds } = useFarm()
  const [localPondConfig, setLocalPondConfig] = useState<PondConfig | null>(null)
  const [samplingRecords, setSamplingRecords] = useState<SamplingRecord[]>([])

  const pondConfig = useMemo(() => {
    if (activePond) {
      return {
        pondName: activePond.name,
        stockingDate: activePond.activeCycle?.stockingDate || new Date().toISOString().split('T')[0],
        seedCount: activePond.activeCycle?.seedStocked || 0,
        pondAreaAcres: activePond.areaAcres || 0,
        targetHarvestCount: activePond.activeCycle?.targetDays
      }
    }
    return localPondConfig
  }, [activePond, localPondConfig])

  // Calculate metrics with memoization
  const latestRecord = useMemo(() =>
    samplingRecords[samplingRecords.length - 1],
    [samplingRecords]
  )

  const previousRecord = useMemo(() =>
    samplingRecords[samplingRecords.length - 2],
    [samplingRecords]
  )

  const adg = useMemo(() =>
    latestRecord && previousRecord
      ? calculateADG(latestRecord, previousRecord)
      : null,
    [latestRecord, previousRecord]
  )

  const biomass = useMemo(() =>
    latestRecord && pondConfig
      ? calculateBiomassKg(pondConfig.seedCount, latestRecord.survivalPercent, latestRecord.mbwGrams)
      : 0,
    [latestRecord, pondConfig]
  )

  const handlePondConfigChange = (config: PondConfig) => {
    setLocalPondConfig(config)
    setSamplingRecords([])
  }

  const handleSamplingRecord = (record: SamplingRecord) => {
    setSamplingRecords(prev => [...prev, record])
  }

  if (!pondConfig) {
    return (
      <div className="space-y-6">
        <div className="page-heading animate-in">
          <div>
            <span className="eyebrow">GROWTH TRACKER</span>
            <h1>Pond Cycle Setup</h1>
            <p>Select a pond from the switcher or configure pond details manually.</p>
          </div>
          <span className="heading-orbit" aria-hidden="true">📈</span>
        </div>

        {ponds.length > 0 && (
          <div className="card-surface">
            <p className="quiet-state">Please select an active pond from the switcher above to sync its data here.</p>
          </div>
        )}

        <div className="card-surface">
          <h3>Manual Configuration</h3>
          <PondConfigForm onChange={handlePondConfigChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-heading animate-in">
        <div>
          <span className="eyebrow">GROWTH TRACKER</span>
          <h1>{pondConfig.pondName} - Growth Analytics</h1>
          <p>Tracking {activePond?.activeCycle?.doc !== undefined ? (activePond.activeCycle.doc === 0 ? "New" : `DOC ${activePond.activeCycle.doc}`) : (samplingRecords.length > 0 ? (samplingRecords[samplingRecords.length - 1].doc === 0 ? "New" : `DOC ${samplingRecords[samplingRecords.length - 1].doc}`) : "New")} • {pondConfig.seedCount.toLocaleString('en-IN')} seeds</p>
          <p className="telugu-subtitle" lang="te">ప్రస్తుతం ఉన్న రోజులు: {activePond?.activeCycle?.doc !== undefined ? (activePond.activeCycle.doc === 0 ? "కొత్తది" : `${activePond.activeCycle.doc}`) : (samplingRecords.length > 0 ? (samplingRecords[samplingRecords.length - 1].doc === 0 ? "కొత్తది" : `${samplingRecords[samplingRecords.length - 1].doc}`) : "కొత్తది")} • {pondConfig.seedCount.toLocaleString('en-IN')} రొయ్య పిల్లలు</p>
        </div>
        <span className="heading-orbit" aria-hidden="true">📈</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card-surface">
          <h3>Sampling Log</h3>
          <SamplingForm 
            pondConfig={pondConfig} 
            onRecord={handleSamplingRecord} 
          />
        </div>

        <div className="card-surface">
          <h3>Growth Chart</h3>
          <GrowthChart 
            records={samplingRecords} 
            benchmarks={benchmarks || []}
          />
        </div>

        <div className="card-surface">
          <h3>Metrics Dashboard</h3>
          <MetricsDashboard 
            pondConfig={pondConfig}
            latestRecord={latestRecord}
            adg={adg}
            biomass={biomass}
          />
        </div>
      </div>
    </div>
  )
}

// Growth Chart Component
function GrowthChart({ 
  records, 
  benchmarks 
}: { 
  records: SamplingRecord[]
  benchmarks: Benchmark[]
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Add sampling records to see growth chart</p>
      </div>
    )
  }

  const chartData = useMemo(() =>
    records.map((record) => {
      const benchmark = benchmarks.find(b => b.doc === record.doc)
      return {
        doc: record.doc,
        mbw: record.mbwGrams,
        benchmark: benchmark ? benchmark.expected_abw_g : null
      }
    }),
    [records, benchmarks]
  )

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="doc" name="Day of Culture" />
          <YAxis name="Mean Body Weight (g)" domain={[0, 'dataMax']} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="mbw"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Actual MBW"
          />
          {benchmarks.length > 0 && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Vannamei Benchmark"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Pond Configuration Form
function PondConfigForm({ onChange }: { onChange: (config: PondConfig) => void }) {
  const [form, setForm] = useState<PondConfig>({
    pondName: '',
    stockingDate: '',
    seedCount: 0,
    pondAreaAcres: 0,
    targetHarvestCount: undefined
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onChange(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Pond Name</label>
        <input
          name="pondName"
          value={form.pondName}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="e.g., Pond A1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Stocking Date</label>
        <input
          name="stockingDate"
          type="date"
          value={form.stockingDate}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Seed Count</label>
        <input
          name="seedCount"
          type="number"
          min="1000"
          value={form.seedCount}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Number of seeds stocked"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Pond Area (acres)</label>
        <input
          name="pondAreaAcres"
          type="number"
          step="0.01"
          min="0.01"
          value={form.pondAreaAcres}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Pond area in acres"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Target Harvest Count (optional)</label>
        <input
          name="targetHarvestCount"
          type="number"
          min="1"
          value={form.targetHarvestCount || ''}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Expected count at harvest"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Save Pond Configuration
      </button>
    </form>
  )
}

// Sampling Form
function SamplingForm({ 
  pondConfig, 
  onRecord 
}: { 
  pondConfig: PondConfig | null
  onRecord: (record: SamplingRecord) => void
}) {
  const [form, setForm] = useState<SamplingRecord>({
    doc: 0,
    mbwGrams: 0,
    cumulativeFeedKg: 0,
    survivalPercent: 85
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pondConfig) {
      onRecord(form)
      // Reset form for next entry
      setForm(prev => ({
        ...prev,
        doc: prev.doc + 7, // Increment DOC by 1 week by default
        mbwGrams: 0,
        cumulativeFeedKg: 0,
        survivalPercent: 85
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Day of Culture (DOC)
          <span className="text-xs text-gray-500 block telugu-label" lang="te">కల్చర్ రోజు (DOC) - ఎండోధాన్యం తర్వాత రోజులు లెక్క</span>
        </label>
        <input
          name="doc"
          type="number"
          min="0"
          value={form.doc}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          required
        />
        <p className="text-xs text-gray-500 mt-1 telugu-example" lang="te">ఉదా: స్టాకింగ్ తర్వాత 30వ రోజు అయితే 30 నమోదు చేయండి</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Mean Body Weight (MBW) grams
          <span className="text-xs text-gray-500 block telugu-label" lang="te">సగటు శరీర బరువు (MBW) గ్రాములు</span>
        </label>
        <input
          name="mbwGrams"
          type="number"
          step="0.01"
          min="0"
          value={form.mbwGrams}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Average weight per shrimp in grams"
          required
        />
        <p className="text-xs text-gray-500 mt-1 telugu-example" lang="te">ఉదా: కొన్ని రొయ్యలను తూకం పెట్టి సగటు బరువు తెలుసుకోండి</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Cumulative Feed (kg)
          <span className="text-xs text-gray-500 block telugu-label" lang="te">మొత్తం ఫీడ్ (కిలోలు)</span>
        </label>
        <input
          name="cumulativeFeedKg"
          type="number"
          step="0.01"
          min="0"
          value={form.cumulativeFeedKg}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Total feed used to date"
          required
        />
        <p className="text-xs text-gray-500 mt-1 telugu-example" lang="te">ఉదా: ప్రారంభం నుండి ఇప్పటి వరకు ఇచ్చిన మొత్తం ఫీడ్ కిలోలలో</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Estimated Survival %
          <span className="text-xs text-gray-500 block telugu-label" lang="te">అంచనా జీవనశాతం %</span>
        </label>
        <input
          name="survivalPercent"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={form.survivalPercent}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          placeholder="Estimated survival percentage"
        />
        <p className="text-xs text-gray-500 mt-1 telugu-example" lang="te">ఉదా: మొక్కలు 1000 ఉంటే 850 బ్రతికితే 85% నమోదు చేయండి</p>
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Add Sampling Record
      </button>
    </form>
  )
}

// Harvest Optimizer - calculates optimal harvest date based on growth + price projections
function HarvestOptimizer({
  pondConfig,
  latestRecord,
  adg,
  biomass,
  region = 'Bhimavaram'
}: {
  pondConfig: PondConfig | null
  latestRecord: SamplingRecord | null
  adg: number | null
  biomass: number
  region?: string
}) {
  if (!pondConfig || !latestRecord || adg === null || adg <= 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold mb-2 text-gray-600">🎯 Harvest Optimizer</h4>
        <p className="text-sm text-gray-500">Add sampling records with ADG to see optimal harvest recommendations.</p>
      </div>
    )
  }

  const [harvestProjection, setHarvestProjection] = useState<{
    optimalDay: number
    optimalCountSize: number
    projectedPrice: number
    projectedRevenue: number
    daysToHarvest: number
    harvestDate: string
    priceProjection: PriceProjection | null
    loading: boolean
    error: string | null
  } | null>(null)

  useEffect(() => {
    const calculateOptimalHarvest = async () => {
      setHarvestProjection({
        optimalDay: 0,
        optimalCountSize: 0,
        projectedPrice: 0,
        projectedRevenue: 0,
        daysToHarvest: 0,
        harvestDate: '',
        priceProjection: null,
        loading: true,
        error: null
      })

      try {
        const currentDoc = latestRecord.doc
        const currentMbw = latestRecord.mbwGrams

        // Look ahead 30-60 days in 7-day increments
        const scenarios = []
        for (let daysAhead = 7; daysAhead <= 60; daysAhead += 7) {
          const harvestDoc = currentDoc + daysAhead
          const estimatedCount = estimateHarvestCount(currentMbw, adg, daysAhead)

          if (!estimatedCount) continue

          const countTier = nearestCountTier(estimatedCount)

          // Get price projection for this count tier
          const prices = await fetchMarketPrice(region, countTier)
          let priceProjection: PriceProjection | null = null
          let projectedPrice = 350 // fallback

          if (prices.length > 0) {
            // Use latest price as current
            const latestPrice = prices[0].pricePerKg
            const history = prices.map(p => ({ pricePerKg: p.pricePerKg, date: p.date }))
            priceProjection = projectPrice(latestPrice, history, 'stable', daysAhead)
            projectedPrice = priceProjection.projectedPrice || latestPrice
          }

          // Estimate survival at harvest (gradual decline)
          const survivalAtHarvest = Math.max(
            latestRecord.survivalPercent * Math.pow(0.995, daysAhead),
            40
          )

          const harvestBiomass = calculateBiomassKg(
            pondConfig.seedCount,
            survivalAtHarvest,
            currentMbw + (adg * daysAhead)
          )

          const projectedRevenue = harvestBiomass * projectedPrice

          scenarios.push({
            daysAhead,
            harvestDoc,
            countTier,
            projectedPrice,
            harvestBiomass,
            projectedRevenue,
            priceProjection,
            harvestDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        }

        // Find optimal (max revenue)
        const optimal = scenarios.reduce((best, curr) =>
          curr.projectedRevenue > best.projectedRevenue ? curr : best
        , scenarios[0])

        setHarvestProjection({
          optimalDay: optimal.harvestDoc,
          optimalCountSize: optimal.countTier,
          projectedPrice: optimal.projectedPrice,
          projectedRevenue: optimal.projectedRevenue,
          daysToHarvest: optimal.daysAhead,
          harvestDate: optimal.harvestDate,
          priceProjection: optimal.priceProjection,
          loading: false,
          error: null
        })
      } catch (error) {
        setHarvestProjection({
          optimalDay: 0,
          optimalCountSize: 0,
          projectedPrice: 0,
          projectedRevenue: 0,
          daysToHarvest: 0,
          harvestDate: '',
          priceProjection: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to calculate'
        })
      }
    }

    calculateOptimalHarvest()
  }, [pondConfig, latestRecord, adg, region])

  if (!harvestProjection) return null

  if (harvestProjection.loading) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-2">🎯 Harvest Optimizer</h4>
        <p className="text-sm text-blue-700">Analyzing growth trajectory & market prices...</p>
      </div>
    )
  }

  if (harvestProjection.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h4 className="font-semibold mb-2 text-red-800">🎯 Harvest Optimizer</h4>
        <p className="text-sm text-red-700">Error: {harvestProjection.error}</p>
      </div>
    )
  }

  const hp = harvestProjection
  const currentDoc = latestRecord.doc
  const daysToTargetCount = hp.optimalDay - currentDoc

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
      <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
        🎯 Optimal Harvest Recommendation
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Target Harvest Date</p>
          <p className="text-lg font-bold text-green-700">{new Date(hp.harvestDate).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Days from Now</p>
          <p className="text-lg font-bold text-green-700">{hp.daysToHarvest} days</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Target DOC</p>
          <p className="text-lg font-bold text-green-700">{hp.optimalDay}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Projected Count Size</p>
          <p className="text-lg font-bold text-green-700">{hp.optimalCountSize} count</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Projected Price/kg</p>
          <p className="text-lg font-bold text-amber-700">₹{hp.projectedPrice.toFixed(0)}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-500">Projected Revenue</p>
          <p className="text-xl font-bold text-amber-700">₹{hp.projectedRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {hp.priceProjection && hp.priceProjection.delta !== null && (
        <div className="bg-white p-3 rounded border border-green-200">
          <p className="text-xs text-gray-500 mb-1">Price Trend Forecast</p>
          <p className={`text-sm font-medium ${hp.priceProjection.delta > 0 ? 'text-green-600' : hp.priceProjection.delta < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {hp.priceProjection.advice}
          </p>
          <p className="text-xs text-gray-500">
            Confidence: {hp.priceProjection.confidence} • {hp.priceProjection.deltaPercent?.toFixed(1)}% change projected
          </p>
        </div>
      )}

      <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
        <p className="text-sm text-green-800">
          <strong>Recommendation:</strong> Harvest around <strong>DOC {hp.optimalDay}</strong> ({hp.daysToHarvest} days from now)
          when shrimp reach ~{hp.optimalCountSize} count/kg for maximum revenue of ~₹{hp.projectedRevenue.toLocaleString('en-IN')}.
        </p>
      </div>
    </div>
  )
}

// Metrics Dashboard
function MetricsDashboard({
  pondConfig,
  latestRecord,
  adg,
  biomass
}: {
  pondConfig: PondConfig | null
  latestRecord: SamplingRecord | null
  adg: number | null
  biomass: number
}) {
  const fcr = useMemo(() =>
    latestRecord && pondConfig && biomass > 0
      ? latestRecord.cumulativeFeedKg / biomass
      : 0,
    [latestRecord?.cumulativeFeedKg, biomass, pondConfig]
  )

  const [currentPrice, setCurrentPrice] = useState<number>(350)
  const [priceLoading, setPriceLoading] = useState(true)

  useEffect(() => {
    const loadPrice = async () => {
      try {
        const prices = await fetchMarketPrice('Bhimavaram', 40)
        if (prices.length > 0) {
          setCurrentPrice(prices[0].pricePerKg)
        }
      } catch (e) {
        console.error('Failed to load market price', e)
      } finally {
        setPriceLoading(false)
      }
    }
    void loadPrice()
  }, [])

  const gcvm = useMemo(() =>
    pondConfig && latestRecord
      ? biomass * currentPrice
      : 0,
    [biomass, pondConfig, latestRecord, currentPrice]
  )

  const stuntedCheck = useMemo(() =>
    adg !== null && latestRecord
      ? detectStuntedGrowth(adg, latestRecord.doc)
      : null,
    [adg, latestRecord?.doc]
  )

  return (
    <div className="grid gap-4">
      {stuntedCheck?.isStunted && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold mb-2 text-red-800">⚠️ Stunted Growth Alert</h4>
          <p className="text-sm text-red-700">{stuntedCheck.message}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-2">Estimated Biomass</h4>
        <p className="text-2xl font-bold text-blue-800">{biomass.toFixed(2)} kg</p>
        <p className="text-sm text-gray-600">Total estimated biomass</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold mb-2">Actual FCR</h4>
        <p className="text-2xl font-bold text-green-800">{fcr.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Feed Conversion Ratio</p>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 className="font-semibold mb-2">ADG</h4>
        <p className="text-2xl font-bold text-purple-800">{adg !== null ? adg.toFixed(2) : '--'} g/day</p>
        <p className="text-sm text-gray-600">Average Daily Growth</p>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h4 className="font-semibold mb-2">Gross Crop Value</h4>
        <p className="text-2xl font-bold text-amber-800">₹{gcvm.toFixed(0)}</p>
        <p className="text-sm text-gray-600">Estimated value at harvest (at ₹{currentPrice.toFixed(0)}/kg current market price)</p>
        {priceLoading && <p className="text-xs text-gray-500 mt-1">Loading current price...</p>}
      </div>

      <HarvestOptimizer
        pondConfig={pondConfig}
        latestRecord={latestRecord}
        adg={adg}
        biomass={biomass}
        region="Bhimavaram"
      />
    </div>
  )
}
