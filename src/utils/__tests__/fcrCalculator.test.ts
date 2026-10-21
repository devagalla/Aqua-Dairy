import { calculateBiomassKg, calculateDailyFeedKg, calculateFcr } from '../fcrCalculator'

describe('fcrCalculator', () => {
  test('calculateBiomassKg computes correct biomass', () => {
    // 50,000 seeds, 80% survival, 10g weight = 40,000 shrimp * 10g = 400,000g = 400kg
    expect(calculateBiomassKg(50000, 80, 10)).toBe(400)
  })

  test('calculateFcr computes ratio correctly', () => {
    // 100kg feed, 50kg biomass gain = 2.0 FCR
    expect(calculateFcr(100, 50)).toBe(2)
  })
})
