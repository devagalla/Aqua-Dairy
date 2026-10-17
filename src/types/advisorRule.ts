import { z } from 'zod'

export interface AdvisorRule {
  id: string
  name: string
  parameter: string
  minThreshold?: number | null
  maxThreshold?: number | null
  severity: 'GREEN' | 'YELLOW' | 'RED'
  cultureDayFrom?: number | null
  cultureDayTo?: number | null
  messageEn: string
  messageTe: string
  actionEn: string
  actionTe: string
  enabled: boolean
  createdAt?: string
}

export const AdvisorRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parameter: z.string(),
  minThreshold: z.coerce.number().nullish(),
  maxThreshold: z.coerce.number().nullish(),
  severity: z.enum(['GREEN', 'YELLOW', 'RED']),
  cultureDayFrom: z.coerce.number().nullish(),
  cultureDayTo: z.coerce.number().nullish(),
  messageEn: z.string(),
  messageTe: z.string(),
  actionEn: z.string(),
  actionTe: z.string(),
  enabled: z.boolean(),
  createdAt: z.string().nullish(),
})
