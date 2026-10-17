import { z } from 'zod'

export interface Expense {
  id: string
  farmId: string
  date: string // ISO date
  category: string
  description: string
  amount: number
  receiptUrl?: string
  createdAt?: string
}

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  date: z.coerce.date(),
  category: z.string(),
  description: z.string(),
  amount: z.coerce.number(),
  receiptUrl: z.string().url().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})
