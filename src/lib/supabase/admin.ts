import { createClient } from '@supabase/supabase-js'

/**
 * Admin‑role Supabase client – NEVER exposed to the browser.
 * Must only be used in server‑side code.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
