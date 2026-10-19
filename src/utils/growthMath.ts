import benchmarks from '../data/shrimpGrowthBenchmarks.json'

export interface SamplingRecord {
  doc: number
  mbwGrams: number
  cumulativeFeedKg: number
  survivalPercent: number
}

export interface CycleConfig {
  pondName: string
  pondId: string
  stockingDate: string
  seedCount: number
  pondAreaAcres: number
  targetHarvestCount?: number
}

/**
 * Calculates Average Daily Growth (ADG) in grams/day
 * ADG = (MBW_current - MBW_prev) / (DOC_current - DOC_prev)
 */
export function calculateADG(
  current: SamplingRecord,
  previous: SamplingRecord
): number | null {
  const daysBetween = current.doc - previous.doc
  
  if (daysBetween <= 0) {
    return null
  }
  
  const weightGain = current.mbwGrams - previous.mbwGrams
  return weightGain / daysBetween
}

/**
 * Detects stunted growth based on ADG threshold
 * Flag alert if ADG < 0.15 g/day between sampling points
 */
export function detectStuntedGrowth(
  adg: number | null,
  currentDoc: number,
  actualAbw: number
): { isStunted: boolean; message?: string } {
  if (adg === null) {
    return { isStunted: false }
  }

  // Check ADG threshold
  if (adg < 0.15) {
    return {
      isStunted: true,
      message: 'Stunted growth detected: ADG below 0.15 g/day'
    }
  }

  // Additional check for older shrimp
  if (currentDoc >= 40 && adg < 0.2) {
    return {
      isStunted: true,
      message: 'Stunted growth detected: ADG below 0.20 g/day for DOC >= 40'
    }
  }

  return { isStunted: false }
}

/**
 * Calculates actual FCR (Feed Conversion Ratio)
 * FCR = Cumulative Feed (kg) / Biomass (kg)
 * Biomass = (Stocked Count * Survival Rate * Current MBW) / 1000
 */
export function calculateActualFCR(
  cumulativeFeedKg: number,
  seedCount: number,
  survivalPercent: number,
  currentMBWG: number
): number | null {
  const biomassKg = (seedCount * (survivalPercent / 100) * currentMBWG) / 1000
  
  if (biomassKg <= 0) {
    return null
  }
  
  return cumulativeFeedKg / biomassKg
}

/**
 * Estimates gross crop value
 * Gross Value = Biomass (kg) * Market Price per kg
 */
export function estimateGrossValue(
  biomassKg: number,
  pricePerKg: number
): number {
  return biomassKg * pricePerKg
}

/**
 * Calculates biomass in kg
 * Biomass = (Stocked Count * Survival Rate * Current MBW) / 1000
 */
export function calculateBiomassKg(
  seedCount: number,
  survivalPercent: number,
  currentMBWG: number
): number {
  return (seedCount * (survivalPercent / 100) * currentMBWG) / 1000
}

/**
 * Calculates expected ABW using benchmark interpolation
 */
export function getExpectedABW(doc: number): number {
  const benchmarkList: { doc: number; expected_abw_g: number }[] = benchmarks
  
  if (doc <= benchmarkList[0].doc) {
    return benchmarkList[0].expected_abw_g
  }
  
  if (doc >= benchmarkList[benchmarkList.length - 1].doc) {
    return benchmarkList[benchmarkList.length - 1].expected_abw_g
  }

  for (let i = 0; i < benchmarkList.length - 1; i++) {
    const p1 = benchmarkList[i]
    const p2 = benchmarkList[i + 1]
    
    if (doc >= p1.doc && doc <= p2.doc) {
      const fraction = (doc - p1.doc) / (p2.doc - p1.doc)
      return p1.expected_abw_g + fraction * (p2.expected_abw_g - p1.expected_abw_g)
    }
  }

  return benchmarkList[benchmarkList.length - 1].expected_abw_g
}