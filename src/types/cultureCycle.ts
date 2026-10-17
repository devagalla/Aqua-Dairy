import { z } from 'zod'

export interface CultureCycle {
  id: string
  pondId: string
  seedStocked: number
  stockingDate: string // ISO date
  pl?: string
  targetHarvestDays?: number | null
  createdAt?: string
}

export const CultureCycleSchema = z.object({
  id: z.string().uuid(),
  pondId: z.string().uuid(),
  seedStocked: z.coerce.number().int(),
  stockingDate: z.coerce.date(),
  pl: z.string().nullable(),
  targetHarvestDays: z.coerce.number().nullable(),
  createdAt: z.string().nullable(),
})
