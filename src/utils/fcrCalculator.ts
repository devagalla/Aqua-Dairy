import thresholds from '../data/thresholds.json'

export type FeedRatePosition = 'low' | 'mid' | 'high'

/**
 * Returns the recommended body weight percentage feed rate for a given ABW
 */
export function getFeedRatePercentage(abwGrams: number, position: FeedRatePosition = 'mid'): number {
  let band: { min: number; mid: number; max: number }

  if (abwGrams < 5) {
    band = thresholds.feedRateBands.lessThan5
  } else if (abwGrams < 10) {
    band = thresholds.feedRateBands['5ToUnder10']
  } else if (abwGrams < 15) {
    band = thresholds.feedRateBands['10ToUnder15']
  } else if (abwGrams < 20) {
    band = thresholds.feedRateBands['15ToUnder20']
  } else {
    band = thresholds.feedRateBands['20AndUp']
  }

  if (position === 'low') return band.min
  if (position === 'high') return band.max
  return band.mid
}

/**
 * Calculates total estimated biomass in kg given total PL, survival rate %, and current ABW in grams
 */
export function calculateBiomassKg(totalPl: number, survivalPercent: number, abwGrams: number): number {
  const estimatedPopulation = totalPl * (survivalPercent / 100)
  const totalBiomassGrams = estimatedPopulation * abwGrams
  return totalBiomassGrams / 1000
}

/**
 * Calculates total baseline daily feed requirement in kg based on ABW, total PL, and survival rate
 */
export function calculateDailyFeedKg(
  abwGrams: number,
  totalPl: number,
  survivalPercent: number,
  position: FeedRatePosition = 'mid'
): number {
  const biomassKg = calculateBiomassKg(totalPl, survivalPercent, abwGrams)
  const feedRatePct = getFeedRatePercentage(abwGrams, position)
  return (biomassKg * feedRatePct) / 100
}

/**
 * Divides total daily feed equally across specified number of meals
 */
export function calculateMealBreakdown(dailyFeedKg: number, mealsPerDay: number = 4): number[] {
  if (mealsPerDay <= 0) return []
  const perMeal = dailyFeedKg / mealsPerDay
  // Round each meal to 2 decimal places
  const mealAmount = Math.round(perMeal * 100) / 100
  return Array(mealsPerDay).fill(mealAmount)
}

/**
 * Calculates FCR (Feed Conversion Ratio) = Total Feed Given (kg) / Estimated Net Biomass Gain (kg)
 * If initial biomass is not provided, assumes initial biomass = 0.
 */
export function calculateFcr(
  totalFeedKg: number,
  currentBiomassKg: number,
  initialBiomassKg: number = 0
): number | null {
  const biomassGain = currentBiomassKg - initialBiomassKg
  if (biomassGain <= 0) return null
  return Math.round((totalFeedKg / biomassGain) * 100) / 100
}
