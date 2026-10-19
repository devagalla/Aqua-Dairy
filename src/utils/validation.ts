import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const optionalNullableNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.coerce.number().nullable(),
)

export const WaterSchema = z.object({
  id: z.string().uuid().optional(),
  cycle_id: z.string().uuid(),
  logged_at: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date and time')
    .transform((value) => new Date(value).toISOString()),
  temperature_c: optionalNullableNumber,
  pH: optionalNullableNumber,
  do_mg_l: optionalNullableNumber,
  salinity_pps: optionalNullableNumber,
  ammonia_mg_l: optionalNullableNumber,
  nitrite_mg_l: optionalNullableNumber,
  alkalinity_ppms: optionalNullableNumber,
  transparency_lux: optionalNullableNumber,
  comment: z.string().nullable().optional(),
})

type WaterLogInput = z.infer<typeof WaterSchema>
type WaterParameter =
  | 'temperature_c'
  | 'pH'
  | 'do_mg_l'
  | 'salinity_pps'
  | 'ammonia_mg_l'
  | 'nitrite_mg_l'
  | 'alkalinity_ppms'
  | 'transparency_lux'

type AdvisorRule = {
  id: string
  parameter: WaterParameter
  min_threshold: number | null
  max_threshold: number | null
  severity: string
  message_en: string
  action_en: string
  enabled: boolean
  [key: string]: string | number | boolean | null
}

export async function evaluateRules(
  log: Partial<WaterLogInput>,
  supabase: SupabaseClient,
) {
  const locale = process.env.NEXT_PUBLIC_LOCALE?.slice(0, 2) ?? 'en';
  const { data, error } = await supabase
    .from('advisor_rules')
    .select('*')
    .eq('enabled', true);
  if (error) throw error

  const rules = data as unknown as AdvisorRule[] | null
  if (!rules) return []

  const alerts: Array<{
    rule_id: string
    severity: string
    message: string
    action: string
  }> = []
  for (const rule of rules) {
    const value = log[rule.parameter]
    if (value == null) continue;
    const below = rule.min_threshold != null && value < rule.min_threshold
    const above = rule.max_threshold != null && value > rule.max_threshold
    if (below || above) {
      alerts.push({
        rule_id: rule.id,
        severity: rule.severity,
        message:
          (rule[`message_${locale}`] as string | null) ?? rule.message_en,
        action:
          (rule[`action_${locale}`] as string | null) ?? rule.action_en,
      })
    }
  }
  return alerts
}
