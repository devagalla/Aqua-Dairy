import { z } from 'zod'

export interface Harvest {
  id: string
  cycleId: string
  harvestedAt: string // ISO datetime
  totalWeightKg: number
  averageWeightKg: number
  survivalRate: number // percentage
  totalRevenue?: number
  remarks?: string
  createdAt?: string
}

export const HarvestSchema = z.object({
  id: z.string().uuid(),
  cycleId: z.string().uuid(),
  harvestedAt: z.coerce.date(),
  totalWeightKg: z.coerce.number(),
  averageWeightKg: z.coerce.number(),
  survivalRate: z.coerce.number().min(0).max(100),
  totalRevenue: z.coerce.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})
