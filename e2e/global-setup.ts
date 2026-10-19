// Global setup for Playwright E2E tests
// This runs once before all tests

import { FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Global setup: Starting dev server for E2E tests...')

  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000'
  console.log(`🌐 Base URL: ${baseURL}`)

  // Create test user in Supabase using service role
  // Use require to get the env vars that were set at config load time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyxqtpzdkgtpjbsybsms.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '***REMOVED***'

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('⚠️  Supabase credentials not configured, skipping test user creation')
    console.log('✅ Global setup complete')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const testEmail = process.env.E2E_TEST_EMAIL || 'test-farmer@aquadairy.local'
  const testPassword = process.env.E2E_TEST_PASSWORD || 'TestPass123!'

  console.log(`👤 Creating test user: ${testEmail}`)

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u: { email?: string }) => u.email === testEmail)

  if (existingUser) {
    console.log('✅ Test user already exists')

    // Ensure email is confirmed
    if (existingUser && !existingUser.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      })
      console.log('✅ Test user email confirmed')
    }
  } else {
    // Create new test user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'E2E Test Farmer',
      },
    })

    if (error) {
      console.error('❌ Failed to create test user:', error.message)
    } else {
      console.log('✅ Test user created and email confirmed')
    }
  }

  console.log('✅ Global setup complete')
}

export default globalSetup