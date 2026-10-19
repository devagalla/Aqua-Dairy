import { z } from 'zod'

export interface Sampling {
  id: string
  cycle_id: string
  user_id?: string
  date: string
  sample_count: number
  sample_total_weight_g: number
  abw_g: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const SamplingSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  sample_count: z.coerce.number().int().positive(),
  sample_total_weight_g: z.coerce.number().positive(),
  abw_g: z.coerce.number().positive(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})