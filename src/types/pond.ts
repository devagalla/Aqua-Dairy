import { z } from 'zod'

export type AreaUnit = 'acre' | 'hectare'

export interface Pond {
  id: string
  farmId: string
  name: string
  area?: number | null
  area_unit?: AreaUnit
  areaAcres?: number | null // legacy field
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  user_id?: string
}

export const PondSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  area: z.coerce.number().positive().nullable(),
  area_unit: z.enum(['acre', 'hectare']).optional(),
  areaAcres: z.coerce.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
  user_id: z.string().uuid().optional(),
})
