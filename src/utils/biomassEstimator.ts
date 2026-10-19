import benchmarks from '../data/shrimpGrowthBenchmarks.json'
import thresholds from '../data/thresholds.json'

export interface GrowthBenchmark {
  doc: number
  expected_abw_g: number
}

/**
 * Converts average body weight in grams to count per kg
 */
export function abwToCountPerKg(abwGrams: number): number {
  if (abwGrams <= 0) return 0
  return Math.round(1000 / abwGrams)
}

/**
 * Calculates ABW from total sample weight in grams and total shrimp counted
 */
export function calculateAbwFromSample(totalWeightGrams: number, sampleCount: number): number {
  if (sampleCount <= 0) return 0
  return totalWeightGrams / sampleCount
}

/**
 * Calculates Average Daily Growth (ADG) in grams/day between two sampling points
 */
export function calculateAdg(
  currentAbw: number,
  previousAbw: number,
  daysBetween: number
): number | null {
  if (daysBetween <= 0) return null
  return (currentAbw - previousAbw) / daysBetween
}

/**
 * Estimates expected ABW for a given DOC using linear interpolation against benchmark table
 */
export function getExpectedAbw(doc: number): number {
  const benchmarkList: GrowthBenchmark[] = benchmarks
  if (doc <= benchmarkList[0].doc) return benchmarkList[0].expected_abw_g
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

/**
 * Evaluates whether current growth is stunted based on thresholds
 */
export function checkStuntedGrowth(
  currentDoc: number,
  actualAbw: number,
  adg: number | null
): { isStunted: boolean; reason?: string } {
  const expectedAbw = getExpectedAbw(currentDoc)
  const growthConfig = thresholds.growth

  // Condition 1: Actual ABW is less than 70% of expected benchmark ABW
  if (actualAbw < expectedAbw * growthConfig.stuntedAdgThresholdMultiplier) {
    return {
      isStunted: true,
      reason: `ABW (${actualAbw.toFixed(1)}g) is below expected benchmark (${expectedAbw.toFixed(1)}g)`,
    }
  }

  // Condition 2: DOC > 40 and ADG < 0.2 g/day
  if (
    currentDoc >= growthConfig.stuntedDocThreshold &&
    adg !== null &&
    adg < growthConfig.stuntedAdgAbsoluteThreshold
  ) {
    return {
      isStunted: true,
      reason: `ADG (${adg.toFixed(2)}g/day) is below minimum growth rate threshold (${growthConfig.stuntedAdgAbsoluteThreshold}g/day)`,
    }
  }

  return { isStunted: false }
}
