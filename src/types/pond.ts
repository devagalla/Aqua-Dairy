import { z } from 'zod'

export interface Pond {
  id: string
  farmId: string
  name: string
  areaAcres?: number | null
  createdAt?: string
}

export const PondSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  areaAcres: z.coerce.number().nullable(),
  createdAt: z.string().nullable(),
})
