import { z } from 'zod'

export interface TrayCheck {
  id: string
  cycle_id: string
  user_id?: string
  date: string
  meal_number: number
  tray_count: number
  leftover_percent: number[]
  checked_after_minutes: number
  gut_observation?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const TrayCheckSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  meal_number: z.coerce.number().int().min(1).max(6),
  tray_count: z.coerce.number().int().min(1).max(6),
  leftover_percent: z.array(z.coerce.number().min(0).max(100)),
  checked_after_minutes: z.coerce.number().int().positive(),
  gut_observation: z.string().nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})