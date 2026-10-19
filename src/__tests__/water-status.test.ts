import { getWaterReadingStatus, type WaterAdvisorRule } from '@/utils/water-status'

const rules: WaterAdvisorRule[] = [
  {
    parameter: 'do_mg_l',
    min_threshold: 4,
    max_threshold: null,
    severity: 'RED',
    message_en: 'Dissolved oxygen is low',
  },
  {
    parameter: 'pH',
    min_threshold: 7,
    max_threshold: 9,
    severity: 'YELLOW',
    message_en: 'Check the pH',
  },
]

describe('water reading status', () => {
  it('shows green when a value is within configured thresholds', () => {
    expect(getWaterReadingStatus('pH', 8, rules)).toEqual({
      level: 'green',
      message: 'Within configured advisor thresholds',
    })
  })

  it('uses the configured alert severity and message when a threshold is crossed', () => {
    expect(getWaterReadingStatus('do_mg_l', 3, rules)).toEqual({
      level: 'red',
      message: 'Dissolved oxygen is low',
    })
  })

  it('does not show a status without a value or configured rule', () => {
    expect(getWaterReadingStatus('pH', null, rules)).toBeNull()
    expect(getWaterReadingStatus('temperature_c', 28, rules)).toBeNull()
  })
})
