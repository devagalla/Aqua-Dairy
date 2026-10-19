import { areaToSqMeters, densityToPlPerM2, calculateTotalPl } from '../utils/units'
import {
  getFeedRatePercentage,
  calculateBiomassKg,
  calculateDailyFeedKg,
  calculateMealBreakdown,
  calculateFcr,
} from '../utils/fcrCalculator'
import {
  abwToCountPerKg,
  calculateAbwFromSample,
  calculateAdg,
  getExpectedAbw,
  checkStuntedGrowth,
} from '../utils/biomassEstimator'
import {
  calculateAverageLeftover,
  evaluateFeedDecision,
} from '../utils/feedDecision'

describe('Phase 2 Pure Logic Engine Tests', () => {
  describe('Case 1: Unit Conversions', () => {
    it('correctly converts 1 acre and 1 hectare to sq meters', () => {
      expect(areaToSqMeters(1, 'acre')).toBeCloseTo(4046.86, 2)
      expect(areaToSqMeters(1, 'hectare')).toBe(10000)
    })

    it('correctly converts density 4 lakh PL/acre to PL/m²', () => {
      // 400,000 / 4046.86 = ~98.84 PL/m²
      const densityPlPerM2 = densityToPlPerM2(4)
      expect(densityPlPerM2).toBeCloseTo(98.84, 1)
    })

    it('calculates total PL stocked correctly for 2 acres at 4 lakh PL/acre', () => {
      // 2 acres * 4046.86 sq m/acre * 98.8416 PL/sq m = 800,000 PL
      const densityPlPerM2 = densityToPlPerM2(4)
      const totalPl = calculateTotalPl(2, 'acre', densityPlPerM2)
      expect(totalPl).toBe(800000)
    })
  });

  describe('Case 2: Daily Feed Baseline Calculation', () => {
    it('calculates expected feed rate percentage and total daily feed for ABW=12g', () => {
      // ABW 12g falls in 10ToUnder15 band (mid: 3.5%)
      const ratePct = getFeedRatePercentage(12, 'mid')
      expect(ratePct).toBe(3.5)

      // 100,000 PL @ 80% survival = 80,000 shrimp
      // Biomass = 80,000 * 12g = 960,000g = 960 kg
      const biomassKg = calculateBiomassKg(100000, 80, 12)
      expect(biomassKg).toBe(960)

      // Daily feed = 960 kg * 3.5% = 33.6 kg
      const dailyFeed = calculateDailyFeedKg(12, 100000, 80, 'mid')
      expect(dailyFeed).toBeCloseTo(33.6, 1)
    })
  });

  describe('Case 3: Meal Breakdown', () => {
    it('splits daily feed accurately across 4 meals', () => {
      const dailyFeedKg = 33.6
      const meals = calculateMealBreakdown(dailyFeedKg, 4)
      expect(meals.length).toBe(4)
      expect(meals).toEqual([8.4, 8.4, 8.4, 8.4])
    })
  });

  describe('Case 4: FCR Calculation', () => {
    it('calculates FCR correctly given total feed given and biomass gain', () => {
      // Total feed given = 1200 kg, Net biomass gain = 1000 kg => FCR = 1.2
      const fcr = calculateFcr(1200, 1000, 0)
      expect(fcr).toBe(1.2)
    })
  });

  describe('Case 5: Sample ABW & Count/kg', () => {
    it('calculates ABW from sample weight and count', () => {
      // 500 grams total weight for 50 shrimp sample = 10g ABW
      const abw = calculateAbwFromSample(500, 50)
      expect(abw).toBe(10)

      // Count per kg for 10g shrimp = 1000 / 10 = 100 count
      const count = abwToCountPerKg(10)
      expect(count).toBe(100)
    })
  });

  describe('Case 6: ADG Calculation & Stunted Growth Check', () => {
    it('calculates ADG and flags stunted growth correctly', () => {
      // Sample 1: 5.0g at DOC 30
      // Sample 2: 5.8g at DOC 40 (10 days between)
      // ADG = (5.8 - 5.0) / 10 = 0.08 g/day
      const adg = calculateAdg(5.8, 5.0, 10)
      expect(adg).toBeCloseTo(0.08, 2)

      // Expected ABW at DOC 40 is 5.0g, but ADG 0.08 is below 0.2 threshold at DOC >= 40
      const check = checkStuntedGrowth(40, 5.8, adg)
      expect(check.isStunted).toBe(true)
      expect(check.reason).toContain('ADG')
    })
  });

  describe('Case 7: Check Tray Feed Adjustments', () => {
    it('applies +5% increase when leftover = 0%', () => {
      const decision = evaluateFeedDecision(100, [0, 0, 0, 0])
      expect(decision.adjustedFeedKg).toBe(105)
      expect(decision.adjustmentPercent).toBe(0.05)
    })

    it('maintains feed when leftover is between 1% and 20%', () => {
      const decision = evaluateFeedDecision(100, [10, 15, 5, 10])
      expect(decision.adjustedFeedKg).toBe(100)
      expect(decision.adjustmentPercent).toBe(0)
    })

    it('reduces feed by 10% when leftover is between 21% and 25%', () => {
      const decision = evaluateFeedDecision(100, [22, 24, 21, 23])
      expect(decision.adjustedFeedKg).toBe(90)
      expect(decision.adjustmentPercent).toBe(-0.10)
    })

    it('reduces feed by 20% when leftover > 25%', () => {
      const decision = evaluateFeedDecision(100, [30, 35, 28, 40])
      expect(decision.adjustedFeedKg).toBe(80)
      expect(decision.adjustmentPercent).toBe(-0.20)
    })
  });

  describe('Case 8: Safety Override with Critical Health Observations', () => {
    it('blocks feed increase when tray is clean (0% leftover) if critical health flag is present', () => {
      // Tray clean would normally increase feed by +5%
      // But observation has white_empty gut
      const decision = evaluateFeedDecision(100, [0, 0, 0, 0], {
        gut: 'white_empty',
      })

      expect(decision.isSafetyOverride).toBe(true)
      expect(decision.adjustmentPercent).toBe(0) // Blocked increase
      expect(decision.adjustedFeedKg).toBe(100)
      expect(decision.messageKeys).toContain('health.increase_blocked')
    })
  });
});