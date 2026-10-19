import { Observation } from '../types/observation'
import thresholds from '../data/thresholds.json'

export interface FeedAdjustmentResult {
  adjustedFeedKg: number
  adjustmentPercent: number
  reasons: string[]
  isSafetyOverride: boolean
  messageKeys: string[]
}

/**
 * Calculates average leftover percentage from array of tray leftover percentages
 */
export function calculateAverageLeftover(leftoverPercents: number[]): number {
  if (!leftoverPercents || leftoverPercents.length === 0) return 0
  const sum = leftoverPercents.reduce((acc, val) => acc + val, 0)
  return sum / leftoverPercents.length
}

/**
 * Evaluates feed decision based on baseline feed, check tray results, and health observations
 */
export function evaluateFeedDecision(
  baselineFeedKg: number,
  leftoverPercents: number[],
  observation?: Partial<Observation>
): FeedAdjustmentResult {
  const averageLeftover = calculateAverageLeftover(leftoverPercents)
  const reasons: string[] = []
  const messageKeys: string[] = []
  let adjustmentPercent = 0
  let isSafetyOverride = false

  // 1. Evaluate Check Tray rule based on Average Leftover (L)
  if (averageLeftover === 0) {
    adjustmentPercent = thresholds.trayAdjustment.increase.adjustment // +0.05 (+5%)
    messageKeys.push(thresholds.trayAdjustment.increase.messageKey)
    reasons.push('Tray clean (0% leftover): Increase feed by 5%')
  } else if (averageLeftover > 0 && averageLeftover <= 20) {
    adjustmentPercent = thresholds.trayAdjustment.maintain.adjustment // 0
    messageKeys.push(thresholds.trayAdjustment.maintain.messageKey)
    reasons.push('Optimal consumption (1-20% leftover): Maintain feed')
  } else if (averageLeftover > 20 && averageLeftover <= 25) {
    adjustmentPercent = thresholds.trayAdjustment.reduceSlight.adjustment // -0.10 (-10%)
    messageKeys.push(thresholds.trayAdjustment.reduceSlight.messageKey)
    reasons.push('Slight overfeeding (21-25% leftover): Reduce feed by 10%')
  } else {
    // > 25%
    adjustmentPercent = thresholds.trayAdjustment.cut.adjustment // -0.20 (-20%)
    messageKeys.push(thresholds.trayAdjustment.cut.messageKey)
    reasons.push('High leftover (>25%): Reduce feed by 20%')
  }

  // 2. Evaluate Health Observations for Safety Overrides
  if (observation) {
    // Critical Health Flags:
    // White/Empty gut, Dark/Black water, Circling behavior at dawn
    const isCriticalGut = observation.gut === 'white_empty'
    const isCriticalWater = observation.water === 'dark_black'
    const isCriticalBehavior = observation.behavior === 'circling_dawn'

    if (isCriticalGut || isCriticalWater || isCriticalBehavior) {
      isSafetyOverride = true

      if (isCriticalGut) {
        reasons.push('Critical health flag: White/Empty gut detected')
        messageKeys.push('health.critical_gut')
      }
      if (isCriticalWater) {
        reasons.push('Critical health flag: Dark/Black water condition')
        messageKeys.push('health.critical_water')
      }
      if (isCriticalBehavior) {
        reasons.push('Critical health flag: Circling behavior at dawn')
        messageKeys.push('health.critical_behavior')
      }

      // Safety Rule: If an INCREASE was recommended but critical flag exists, block the increase!
      if (adjustmentPercent > 0) {
        adjustmentPercent = 0
        reasons.push('Safety override: Blocked feed increase due to critical health alert')
        messageKeys.push('health.increase_blocked')
      } else {
        // Force additional reduction if severe
        adjustmentPercent = Math.min(adjustmentPercent, -0.2)
        reasons.push('Safety override: Reduced feed by 20% due to critical health alert')
      }
    }
  }

  // Calculate final adjusted feed
  const adjustedFeedKg = Math.max(0, baselineFeedKg * (1 + adjustmentPercent))

  return {
    adjustedFeedKg: Math.round(adjustedFeedKg * 100) / 100,
    adjustmentPercent,
    reasons,
    isSafetyOverride,
    messageKeys,
  }
}
