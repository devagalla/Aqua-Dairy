'use client'

import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { calculateADG, detectStuntedGrowth, calculateBiomassKg } from '@/utils/growthMath'
import * as benchmarksData from '@/data/shrimpGrowthBenchmarks.json'

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
  targetHarvestCount?: number
}

interface SamplingRecord {
  doc: number
  mbwGrams: number
  cumulativeFeedKg: number
  survivalPercent: number
}

export default function GrowthTracker() {
  const [pondConfig, setPondConfig] = useState<PondConfig | null>(null)
  const [samplingRecords, setSamplingRecords] = useState<SamplingRecord[]>([])

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
    setPondConfig(config)
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
            <p>Configure your pond details to begin tracking growth and biomass.</p>
          </div>
          <span className="heading-orbit" aria-hidden="true">📈</span>
        </div>

        <div className="card-surface">
          <h3>Pond Configuration</h3>
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
          <p>Tracking DOC {samplingRecords.length > 0 ? samplingRecords[samplingRecords.length - 1].doc : 0} • {pondConfig.seedCount.toLocaleString()} seeds</p>
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
        <label className="block text-sm font-medium mb-2">Day of Culture (DOC)</label>
        <input
          name="doc"
          type="number"
          min="0"
          value={form.doc}
          onChange={handleChange}
          className="w-full min-h-[56px] p-3 border border-gray-300 rounded-lg text-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mean Body Weight (MBW) grams</label>
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
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Cumulative Feed (kg)</label>
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
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Estimated Survival %</label>
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

  const gcvm = useMemo(() =>
    pondConfig && latestRecord
      ? biomass * 350 // Assuming Rs 350/kg price - in reality this would come from market prices
      : 0,
    [biomass, pondConfig, latestRecord]
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
        <p className="text-sm text-gray-600">Estimated value at harvest</p>
      </div>
    </div>
  )
}
