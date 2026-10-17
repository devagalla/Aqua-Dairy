import { z } from 'zod'

export interface AlertLog {
  id: string
  ruleId: string
  waterLogId: string
  severity: 'GREEN' | 'YELLOW' | 'RED'
  acknowledgedAt?: string | null
  createdAt?: string
}

export const AlertLogSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string().uuid(),
  waterLogId: z.string().uuid(),
  severity: z.enum(['GREEN', 'YELLOW', 'RED']),
  acknowledgedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
})
