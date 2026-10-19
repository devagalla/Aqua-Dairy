export type WaterAdvisorRule = {
  parameter: string
  min_threshold: number | null
  max_threshold: number | null
  severity: string
  message_en: string | null
}

export function getWaterReadingStatus(
  parameter: string,
  value: number | null,
  rules: WaterAdvisorRule[],
): { level: 'green' | 'yellow' | 'red'; message: string } | null {
  if (value === null) return null

  const parameterRules = rules.filter((rule) => rule.parameter === parameter)
  if (parameterRules.length === 0) return null

  const triggeredRules = parameterRules.filter(
    (rule) =>
      (rule.min_threshold !== null && value < rule.min_threshold) ||
      (rule.max_threshold !== null && value > rule.max_threshold),
  )

  if (triggeredRules.length === 0) {
    return { level: 'green', message: 'Within configured advisor thresholds' }
  }

  const severityRank: Record<string, number> = { GREEN: 0, YELLOW: 1, RED: 2 }
  const mostSevereRule = triggeredRules.reduce((highest, rule) =>
    (severityRank[rule.severity.toUpperCase()] ?? 1) >
    (severityRank[highest.severity.toUpperCase()] ?? 1)
      ? rule
      : highest,
  )
  const level = mostSevereRule.severity.toLowerCase()
  const message = mostSevereRule.message_en?.trim()

  return {
    level: level === 'red' ? 'red' : level === 'green' ? 'green' : 'yellow',
    message: message || 'Outside an advisor threshold',
  }
}
