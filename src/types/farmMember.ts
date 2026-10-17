import { z } from 'zod'

export interface FarmMember {
  id: string
  farmId: string
  userId: string
  role: 'Farmer' | 'Manager' | 'Admin'
  createdAt?: string
}

export const FarmMemberSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['Farmer', 'Manager', 'Admin']),
  createdAt: z.string().nullable(),
})
