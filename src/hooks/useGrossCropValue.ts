'use client'

import { useState, useEffect, useCallback } from 'react'
import { calculateBiomassKg } from '../utils/growthMath'

type CountSize = 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
type Trend = 'up' | 'stable' | 'down'

interface PriceData {
  id: string
  region: string
  countSize: CountSize
  pricePerKg: number
  trend: Trend
  date: string
  note?: string
}

const API_ENDPOINT = 'https://api.aquasangham.in/api/v1/prices'

export interface GrossCropValueResult {
  biomassKg: number
  pricePerKg: number | null
  grossValue: number | null
  countSize: CountSize | null
  trend: Trend | null
  isStale: boolean
  lastUpdated?: string
}

export function useGrossCropValue(
  seedCount: number,
  survivalPercent: number,
  mbwGrams: number,
  countSize: CountSize | null,
  region: string = 'Bhimavaram'
) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Calculate biomass
  const biomassKg = calculateBiomassKg(seedCount, survivalPercent, mbwGrams)

  // Fetch prices from API with fallback to localStorage
  const fetchPrices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Try API first
      const response = await fetch(`${API_ENDPOINT}?region=${region}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const priceData: PriceData[] = data.prices || []
        setPrices(priceData)
        
        // Save to localStorage as fallback
        localStorage.setItem('marketPrices', JSON.stringify(priceData))
        
        // Check if stale (>3 days)
        if (priceData.length > 0) {
          const latestDate = new Date(Math.max(...priceData.map(p => new Date(p.date).getTime())))
          const daysDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
          setIsStale(daysDiff > 3)
        }
      } else {
        throw new Error('API response not ok')
      }
    } catch (err) {
      // Fallback to localStorage
      const saved = localStorage.getItem('marketPrices')
      if (saved) {
        const parsed = JSON.parse(saved)
        setPrices(parsed)
        
        const latestDate = new Date(Math.max(...parsed.map((p: PriceData) => new Date(p.date).getTime())))
        const daysDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
        setIsStale(daysDiff > 3)
      } else {
        // Initialize with deterministic sample data (no random to avoid hydration mismatch)
        const samplePrices: PriceData[] = ([30, 40, 50, 60, 70, 80, 90, 100] as CountSize[]).map((count, index) => ({
          id: `${region}-${count}`,
          region,
          countSize: count,
          pricePerKg: 350 + (index * 12) % 100, // Deterministic pseudo-random
          trend: (['up', 'stable', 'down'] as Trend[])[index % 3],
          date: new Date().toISOString().split('T')[0],
        }))
        setPrices(samplePrices)
      }
    } finally {
      setIsLoading(false)
    }
  }, [region])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Find price for current count size
  const currentPrice = countSize ? prices.find(p => p.countSize === countSize && p.region === region) : null

  const result: GrossCropValueResult = {
    biomassKg,
    pricePerKg: currentPrice?.pricePerKg || null,
    grossValue: currentPrice && biomassKg ? biomassKg * currentPrice.pricePerKg : null,
    countSize: countSize || null,
    trend: currentPrice?.trend || null,
    isStale,
    lastUpdated: currentPrice?.date,
  }

  return {
    ...result,
    isLoading,
    error,
    refreshPrices: fetchPrices,
  }
}

/**
 * Hook for getting current market price for a count size
 */
export function useMarketPrice(
  countSize: CountSize | null,
  region: string = 'Bhimavaram'
) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [isStale, setIsStale] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_ENDPOINT}?region=${region}`)
        if (response.ok) {
          const data = await response.json()
          const priceData: PriceData[] = data.prices || []
          setPrices(priceData)
          
          if (priceData.length > 0) {
            const latestDate = new Date(Math.max(...priceData.map(p => new Date(p.date).getTime())))
            const daysDiff = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
            setIsStale(daysDiff > 3)
          }
        }
      } catch {
        // Fallback to localStorage
        const saved = localStorage.getItem('marketPrices')
        if (saved) {
          const parsed = JSON.parse(saved)
          setPrices(parsed)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrices()
  }, [region])

  const currentPrice = countSize ? prices.find(p => p.countSize === countSize && p.region === region) : null

  return {
    pricePerKg: currentPrice?.pricePerKg || null,
    trend: currentPrice?.trend || null,
    isStale,
    isLoading,
    lastUpdated: currentPrice?.date,
  }
}