import { z } from 'zod'

export type Language = 'en' | 'te'
export type FeedRatePosition = 'low' | 'mid' | 'high'

export interface Settings {
  id: string
  user_id: string
  language: Language
  default_currency: string
  meals_per_day: number
  feed_rate_position: FeedRatePosition
  created_at?: string
  updated_at?: string
}

export const SettingsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  language: z.enum(['en', 'te']),
  default_currency: z.string().default('INR'),
  meals_per_day: z.coerce.number().int().min(1).max(6).default(4),
  feed_rate_position: z.enum(['low', 'mid', 'high']).default('mid'),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})