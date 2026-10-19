import { z } from 'zod'

export type CycleStatus = 'active' | 'harvested' | 'paused'

export interface Cycle {
  id: string
  pond_id: string
  user_id?: string
  stocking_date: string
  pl_count: number
  stocking_density_per_m2?: number
  hatchery?: string | null
  estimated_survival_percent: number
  status: CycleStatus
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const CycleSchema = z.object({
  id: z.string().uuid(),
  pond_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  stocking_date: z.string().datetime(),
  pl_count: z.coerce.number().positive(),
  stocking_density_per_m2: z.coerce.number().positive().optional(),
  hatchery: z.string().nullable(),
  estimated_survival_percent: z.coerce.number().min(1).max(100),
  status: z.enum(['active', 'harvested', 'paused']),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})
