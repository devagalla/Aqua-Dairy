import { z } from 'zod'

export interface Farm {
  id: string
  ownerId: string
  name: string
  region?: string
  createdAt?: string
}

export const FarmSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string(),
  region: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})
