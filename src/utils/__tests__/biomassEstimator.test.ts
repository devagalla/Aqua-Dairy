import { calculateADG, detectStuntedGrowth, calculateBiomassKg } from '../growthMath'

describe('growthMath', () => {
  test('calculateADG computes g/day correctly', () => {
    const prev = { doc: 30, mbwGrams: 5, cumulativeFeedKg: 10, survivalPercent: 90 }
    const curr = { doc: 40, mbwGrams: 8, cumulativeFeedKg: 20, survivalPercent: 90 }
    expect(calculateADG(curr, prev)).toBe(0.3)
  })

  test('detectStuntedGrowth flags ADG < 0.15', () => {
    const result = detectStuntedGrowth(0.1, 30)
    expect(result.isStunted).toBe(true)
  })

  test('calculateBiomassKg computes correctly', () => {
    expect(calculateBiomassKg(1000, 100, 10)).toBe(10)
  })
})
