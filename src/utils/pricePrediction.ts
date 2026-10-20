/**
 * Pattern-based shrimp price forecasting for local markets.
 *
 * This is a lightweight heuristic — NOT a trained ML model. It projects a
 * forward price from the recent observed trend so farmers can decide whether
 * to hold or harvest. Every projection is advisory only; actual board rates
 * vary by buyer, size grading and day.
 */

export type CountSize = 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
export type Trend = 'up' | 'stable' | 'down'

interface PricePoint {
  pricePerKg: number
  date: string // ISO yyyy-mm-dd
}

export interface PriceProjection {
  /** Projected price per kg `horizonDays` out. Null when history is too thin. */
  projectedPrice: number | null
  /** Absolute change vs. today's price (INR/kg). */
  delta: number | null
  /** Percentage change vs. today's price. */
  deltaPercent: number | null
  /** Direction implied by the moving average of recent changes. */
  direction: Trend
  /** How confident we are: 'low' (<3 points), 'medium' (3-4), 'high' (5+). */
  confidence: 'low' | 'medium' | 'high'
  /** Human-readable one-line advice for the farmer. */
  advice: string
}

// Per-day drift applied for each trend direction when we only have the
// categorical trend and no numeric history. Calibrated conservatively so a
// week-long horizon moves price by roughly ±3–5%, matching typical Andhra
// spot-market swings.
const TREND_DAILY_DRIFT: Record<Trend, number> = {
  up: 0.006,
  stable: 0,
  down: -0.006,
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO).getTime()
  const b = new Date(bISO).getTime()
  return Math.abs(b - a) / (1000 * 60 * 60 * 24)
}

/**
 * Build a rolling daily rate-of-change from an ordered series of price points
 * (oldest → newest). Returns the mean fractional change per day, or null if
 * fewer than two usable points exist.
 */
function meanDailyChange(history: PricePoint[]): number | null {
  const usable = history.filter(p => Number.isFinite(p.pricePerKg) && p.pricePerKg > 0)
  if (usable.length < 2) return null

  const changes: number[] = []
  for (let i = 1; i < usable.length; i++) {
    const prev = usable[i - 1]
    const curr = usable[i]
    const dt = daysBetween(prev.date, curr.date)
    if (dt <= 0) continue
    const fracChange = (curr.pricePerKg - prev.pricePerKg) / prev.pricePerKg
    changes.push(fracChange / dt)
  }

  if (changes.length === 0) return null
  return changes.reduce((sum, c) => sum + c, 0) / changes.length
}

function confidenceFor(points: number): 'low' | 'medium' | 'high' {
  if (points >= 5) return 'high'
  if (points >= 3) return 'medium'
  return 'low'
}

function adviceFor(deltaPercent: number | null, confidence: PriceProjection['confidence']): string {
  if (deltaPercent === null) {
    return 'Not enough price history yet — log prices over several days for a forecast.'
  }
  const strength = confidence === 'high' ? '' : ' (early signal)'
  if (deltaPercent >= 4) {
    return `Prices trending up${strength}. Holding a few more days may earn more.`
  }
  if (deltaPercent >= 1) {
    return `Mild upward drift${strength}. Good window to plan harvest.`
  }
  if (deltaPercent <= -4) {
    return `Prices falling${strength}. Consider harvesting sooner to avoid loss.`
  }
  if (deltaPercent <= -1) {
    return `Soft downward drift${strength}. Watch the board closely this week.`
  }
  return `Prices steady${strength}. Harvest on your growth readiness, not price.`
}

/**
 * Project the price for a region/count-size `horizonDays` into the future.
 *
 * Prefers numeric history (mean daily change compounded over the horizon).
 * Falls back to the categorical trend when history is too thin.
 */
export function projectPrice(
  currentPrice: number,
  history: PricePoint[],
  fallbackTrend: Trend,
  horizonDays: number
): PriceProjection {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const confidence = confidenceFor(sorted.length)

  const dailyRate = meanDailyChange(sorted) ?? TREND_DAILY_DRIFT[fallbackTrend]
  const factor = Math.pow(1 + dailyRate, horizonDays)
  const projectedPrice = currentPrice * factor

  const delta = projectedPrice - currentPrice
  const deltaPercent = (delta / currentPrice) * 100

  const direction: Trend = deltaPercent > 0.5 ? 'up' : deltaPercent < -0.5 ? 'down' : 'stable'

  return {
    projectedPrice,
    delta,
    deltaPercent,
    direction,
    confidence,
    advice: adviceFor(deltaPercent, confidence),
  }
}

/**
 * Estimate the count-per-kg at a future DOC given a linear ADG trajectory,
 * then match it to the nearest priced tier so revenue projections use the
 * right bucket. Returns null when inputs are missing.
 */
export function estimateHarvestCount(
  currentMbwG: number,
  adgGPerDay: number | null,
  daysToHarvest: number
): number | null {
  if (!Number.isFinite(currentMbwG) || currentMbwG <= 0) return null
  const growth = (adgGPerDay ?? 0) * Math.max(0, daysToHarvest)
  const harvestMbw = currentMbwG + growth
  if (harvestMbw <= 0) return null
  // count/kg ≈ 1000 / avg body weight (g)
  return Math.round(1000 / harvestMbw)
}

/** Snap an arbitrary count to the nearest supported pricing tier. */
export function nearestCountTier(count: number): CountSize {
  const tiers: CountSize[] = [30, 40, 50, 60, 70, 80, 90, 100]
  return tiers.reduce((best, t) =>
    Math.abs(t - count) < Math.abs(best - count) ? t : best
  )
}