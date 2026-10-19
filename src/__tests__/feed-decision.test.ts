import { evaluateFeedDecision, calculateAverageLeftover } from '@/utils/feedDecision'

describe('Feed Decision & Calculation Logic', () => {
  it('calculates average leftover correctly', () => {
    expect(calculateAverageLeftover([10, 20, 30, 40])).toBe(25)
    expect(calculateAverageLeftover([0, 0, 0, 0])).toBe(0)
  })

  it('evaluates feed decision with zero leftover and normal health', () => {
    const result = evaluateFeedDecision(20, [0, 0, 0, 0], {
      gut: 'full_dark',
      water: 'normal',
      behavior: 'normal',
    })
    expect(result.adjustedFeedKg).toBe(21)
    expect(result.adjustmentPercent).toBe(0.05)
    expect(result.isSafetyOverride).toBe(false)
  })

  it('triggers safety override on white/empty gut when increase was recommended', () => {
    const result = evaluateFeedDecision(20, [0, 0, 0, 0], {
      gut: 'white_empty',
      water: 'normal',
      behavior: 'normal',
    })
    expect(result.isSafetyOverride).toBe(true)
    expect(result.adjustedFeedKg).toBe(20)
  })

  it('triggers heavy reduction on high leftover (>25%)', () => {
    const result = evaluateFeedDecision(20, [30, 35, 30, 25], {
      gut: 'full_dark',
      water: 'normal',
      behavior: 'normal',
    })
    expect(result.adjustmentPercent).toBe(-0.2)
    expect(result.adjustedFeedKg).toBe(16)
  })
})
