import { z } from 'zod'

export type MarketTrend = 'up' | 'stable' | 'down'

export interface NewsIndicator {
  id: string
  user_id?: string
  date: string
  trend: MarketTrend
  note: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const NewsIndicatorSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  trend: z.enum(['up', 'stable', 'down']),
  note: z.string().max(200),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})