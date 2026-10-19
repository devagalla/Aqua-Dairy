export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface HealthSymptom {
  id: string
  name: string
  severity: Severity
  description: string
  feedAdjustmentPercent: number
  advice: string
}

export const HEALTH_SYMPTOMS: Record<string, HealthSymptom> = {
  white_gut_white_feces: {
    id: 'white_gut_white_feces',
    name: 'White gut / White feces',
    severity: 'CRITICAL',
    description: 'White gut or white feces observed',
    feedAdjustmentPercent: -50,
    advice: 'Reduce feed by 50% or suspend; alert water parameters'
  },
  loose_shell_soft_shell: {
    id: 'loose_shell_soft_shell',
    name: 'Loose shell / Soft shell',
    severity: 'MEDIUM',
    description: 'Loose or soft shell observed',
    feedAdjustmentPercent: 0,
    advice: 'Maintain feed, recommend mineral supplement'
  },
  black_brown_gill: {
    id: 'black_brown_gill',
    name: 'Black / Brown gill',
    severity: 'HIGH',
    description: 'Black or brown discoloration of gills',
    feedAdjustmentPercent: -30,
    advice: 'Reduce feed by 30%, inspect bottom sludge'
  },
  empty_gut_partial_gut: {
    id: 'empty_gut_partial_gut',
    name: 'Empty gut / Partial gut',
    severity: 'HIGH',
    description: 'Empty or partially filled gut',
    feedAdjustmentPercent: -25,
    advice: 'Reduce feed by 25%, verify feed tray consumption'
  },
  red_body_fluorescent: {
    id: 'red_body_fluorescent',
    name: 'Red body / Fluorescent body',
    severity: 'CRITICAL',
    description: 'Red or fluorescent body coloration',
    feedAdjustmentPercent: -100,
    advice: 'Stop feed, flag pathogen check'
  },
  surface_crowding_lethargy: {
    id: 'surface_crowding_lethargy',
    name: 'Surface crowding / Lethargy',
    severity: 'CRITICAL',
    description: 'Shrimp crowding at surface or lethargic behavior',
    feedAdjustmentPercent: -100,
    advice: 'Urgent DO check, activate all aerators'
  }
}

export interface HealthStatus {
  overallRisk: Severity
  feedAdjustmentPercent: number
  activeSymptoms: HealthSymptom[]
  requiresAction: boolean
}

/**
 * Evaluates overall pond health status based on selected symptoms
 */
export function evaluateHealthStatus(selectedSymptomIds: string[]): HealthStatus {
  const activeSymptoms = selectedSymptomIds
    .map(id => HEALTH_SYMPTOMS[id])
    .filter(Boolean) as HealthSymptom[]

  if (activeSymptoms.length === 0) {
    return {
      overallRisk: 'LOW',
      feedAdjustmentPercent: 0,
      activeSymptoms: [],
      requiresAction: false
    }
  }

  // Determine overall risk (highest severity wins)
  const severityOrder: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const maxSeverity = activeSymptoms.reduce((max, symptom) => {
    return severityOrder.indexOf(symptom.severity) > severityOrder.indexOf(max)
      ? symptom.severity
      : max
  }, 'LOW' as Severity)

  // Calculate feed adjustment (most severe reduction wins, don't compound)
  const feedAdjustments = activeSymptoms
    .map(s => s.feedAdjustmentPercent)
    .filter(adj => adj < 0)
  
  const feedAdjustmentPercent = feedAdjustments.length > 0
    ? Math.min(...feedAdjustments) // Take the most severe reduction
    : 0

  const requiresAction = maxSeverity === 'HIGH' || maxSeverity === 'CRITICAL'

  return {
    overallRisk: maxSeverity,
    feedAdjustmentPercent,
    activeSymptoms,
    requiresAction
  }
}

/**
 * Gets severity color for UI
 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}