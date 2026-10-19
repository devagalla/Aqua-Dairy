'use client'

import { useState } from 'react'
import { HEALTH_SYMPTOMS, evaluateHealthStatus, getSeverityColor, type Severity, type HealthStatus } from '../logic/healthRules'

interface VisualWaterHealthProps {
  onHealthStatusChange?: (status: HealthStatus) => void
}

export default function VisualWaterHealth({ onHealthStatusChange }: VisualWaterHealthProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  
  const healthStatus = evaluateHealthStatus(selectedSymptoms)
  
  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => {
      const newSelection = prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
      
      if (onHealthStatusChange) {
        const newStatus = evaluateHealthStatus(newSelection)
        onHealthStatusChange(newStatus)
      }
      
      return newSelection
    })
  }

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'LOW':
        return '✓'
      case 'MEDIUM':
        return '⚠'
      case 'HIGH':
        return '⚠'
      case 'CRITICAL':
        return '✕'
      default:
        return '?'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Visual Health Checklist</h3>
        <p className="text-gray-600 mb-4">
          Tap the symptoms you observe. Guidance only. Confirm with your aqua technician.
        </p>
        
        {/* Overall Risk Indicator */}
        {healthStatus.activeSymptoms.length > 0 && (
          <div className={`p-4 rounded-lg border-2 mb-4 ${getSeverityColor(healthStatus.overallRisk)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Overall Risk: {healthStatus.overallRisk}</p>
                <p className="text-sm mt-1">
                  Feed adjustment: {healthStatus.feedAdjustmentPercent}% 
                  {healthStatus.feedAdjustmentPercent < 0 ? ' reduction' : ' (no change)'}
                </p>
              </div>
              <span className="text-2xl">{getSeverityIcon(healthStatus.overallRisk)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Symptom Cards */}
      <div className="grid gap-4">
        {Object.values(HEALTH_SYMPTOMS).map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom.id)
          
          return (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`
                min-h-[56px] min-w-[56px] 
                p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(symptom.severity)}`}>
                      {symptom.severity}
                    </span>
                    {isSelected && <span className="text-blue-600">✓</span>}
                  </div>
                  <h4 className="font-semibold text-lg">{symptom.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                  <p className="text-sm text-gray-700 mt-2 font-medium">
                    {symptom.advice}
                  </p>
                </div>
                <span className="ml-4 text-2xl">
                  {getSeverityIcon(symptom.severity)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Symptoms List */}
      {healthStatus.activeSymptoms.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">Active Observations:</h4>
          <ul className="space-y-2">
            {healthStatus.activeSymptoms.map(symptom => (
              <li key={symptom.id} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <div>
                  <p className="font-medium">{symptom.name}</p>
                  <p className="text-sm text-gray-600">{symptom.advice}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}