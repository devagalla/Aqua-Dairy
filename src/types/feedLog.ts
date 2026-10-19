import { z } from 'zod'

export interface FeedLog {
  id: string
  cycle_id: string
  cycleId?: string
  user_id?: string
  date?: string
  loggedAt?: Date | string
  meal_number?: number
  planned_kg?: number
  given_kg?: number
  amountKg?: number
  feed_type?: string | null
  feedType?: string | null
  feedingFrequency?: string | null
  comment?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const FeedLogSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date: z.string().optional(),
  loggedAt: z.union([z.string(), z.date()]).optional(),
  meal_number: z.coerce.number().int().min(1).max(6).optional(),
  planned_kg: z.coerce.number().nonnegative().optional(),
  given_kg: z.coerce.number().nonnegative().optional(),
  amountKg: z.coerce.number().nonnegative().optional(),
  feed_type: z.string().nullable().optional(),
  feedType: z.string().nullable().optional(),
  feedingFrequency: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
}).transform((data) => ({
  ...data,
  cycle_id: data.cycle_id || data.cycleId,
  amountKg: data.amountKg ?? data.given_kg ?? data.planned_kg,
}))
