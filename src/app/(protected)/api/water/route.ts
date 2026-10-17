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
    .insert({ ...result.data, created_at: new Date().toISOString() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const alerts = await evaluateRules(result.data, supabase)
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
      return NextResponse.json(
        { error: `Water log saved, but alert creation failed: ${alertError.message}` },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(data, { status: 201 })
}
