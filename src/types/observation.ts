import { z } from 'zod'

export type WaterColor = 
  | 'brown_golden'
  | 'pea_green'
  | 'dark_black'
  | 'normal'
  | 'other'

export type GutCondition = 
  | 'full_dark'
  | 'broken_intermittent'
  | 'white_empty'
  | 'normal'
  | 'other'

export type Behavior = 
  | 'circling_dawn'
  | 'normal'
  | 'lethargic'
  | 'jumping'
  | 'other'

export interface Observation {
  id: string
  cycle_id: string
  user_id?: string
  date: string
  water?: WaterColor
  gut?: GutCondition
  behavior?: Behavior
  foam?: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const ObservationSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  water: z.enum(['brown_golden', 'pea_green', 'dark_black', 'normal', 'other']).optional(),
  gut: z.enum(['full_dark', 'broken_intermittent', 'white_empty', 'normal', 'other']).optional(),
  behavior: z.enum(['circling_dawn', 'normal', 'lethargic', 'jumping', 'other']).optional(),
  foam: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})