import { NextResponse, type NextRequest } from 'next/server'
import { evaluateRules, WaterSchema } from '@/utils/validation'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const result = WaterSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid water log', details: result.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Please sign in to save water logs.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('water_logs')
    .insert({
      cycle_id: result.data.cycle_id,
      logged_at: result.data.logged_at,
      temperature_c: result.data.temperature_c,
      ph: result.data.pH,
      do_mg_l: result.data.do_mg_l,
      salinity_pps: result.data.salinity_pps,
      ammonia_mg_l: result.data.ammonia_mg_l,
      nitrite_mg_l: result.data.nitrite_mg_l,
      alkalinity_ppms: result.data.alkalinity_ppms,
      transparency_lux: result.data.transparency_lux,
      comment: result.data.comment,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const alerts = await evaluateRules(result.data, supabase)
  let alertWarning: string | null = null
  if (alerts.length > 0) {
    const { error: alertError } = await supabase.from('alert_log').insert(
      alerts.map((alert) => ({
        rule_id: alert.rule_id,
        water_log_id: data.id,
        severity: alert.severity,
        message: alert.message,
        action: alert.action,
      })),
    )

    if (alertError) {
      alertWarning = `Water reading saved, but its alert could not be created: ${alertError.message}`
    }
  }

  return NextResponse.json({ ...data, alert_warning: alertWarning }, { status: 201 })
}
