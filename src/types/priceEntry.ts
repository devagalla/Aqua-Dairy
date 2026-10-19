import { z } from 'zod'

export type CountSize = 30 | 40 | 60 | 80 | 100

export interface PriceEntry {
  id: string
  user_id?: string
  date: string
  count_size: CountSize
  price_per_kg: number
  currency: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export const PriceEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  date: z.string().datetime(),
  count_size: z.union([z.literal(30), z.literal(40), z.literal(60), z.literal(80), z.literal(100)]),
  price_per_kg: z.coerce.number().positive(),
  currency: z.string().default('INR'),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
})