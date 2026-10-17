import { z } from 'zod'

export interface FeedLog {
  id: string
  cycleId: string
  loggedAt: string // ISO datetime
  feedType: string
  amountKg: number
  feedingFrequency?: string
  comment?: string
  createdAt?: string
}

export const FeedLogSchema = z.object({
  id: z.string().uuid(),
  cycleId: z.string().uuid(),
  loggedAt: z.coerce.date(),
  feedType: z.string(),
  amountKg: z.coerce.number(),
  feedingFrequency: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})
