import { z } from 'zod'

export interface WaterLog {
  id: string
  cycleId: string
  loggedAt: string
  temperatureC?: number | null
  pH?: number | null
  doMgL?: number | null
  salinityPps?: number | null
  ammoniaMgL?: number | null
  nitriteMgL?: number | null
  alkalinityPpms?: number | null
  transparencyLux?: number | null
  comment?: string | null
  createdAt?: string
}

export const WaterLogSchema = z.object({
  id: z.string().uuid(),
  cycleId: z.string().uuid(),
  loggedAt: z.coerce.date(),
  temperatureC: z.coerce.number().optional().nullable(),
  pH: z.coerce.number().optional().nullable(),
  doMgL: z.coerce.number().optional().nullable(),
  salinityPps: z.coerce.number().optional().nullable(),
  ammoniaMgL: z.coerce.number().optional().nullable(),
  nitriteMgL: z.coerce.number().optional().nullable(),
  alkalinityPpms: z.coerce.number().optional().nullable(),
  transparencyLux: z.coerce.number().optional().nullable(),
  comment: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
})
