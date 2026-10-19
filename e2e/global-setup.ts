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

  let userId: string

  if (existingUser) {
    console.log('✅ Test user already exists')
    userId = existingUser.id

    // Ensure email is confirmed
    if (!existingUser.email_confirmed_at) {
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
      console.log('✅ Global setup complete')
      return
    } else {
      console.log('✅ Test user created and email confirmed')
      userId = data.user.id
    }
  }

  // Create test farm, pond, and cycle for the test user
  console.log('🏞️  Creating test farm, pond, and cycle...')

  // Create farm
  const { data: farm, error: farmError } = await supabaseAdmin
    .from('farms')
    .insert({
      name: 'E2E Test Farm',
      locality: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      owner_id: userId,
    })
    .select('id')
    .single()

  if (farmError) {
    console.log('⚠️  Farm may already exist or error:', farmError.message)
    // Try to get existing farm
    const { data: existingFarm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', userId)
      .single()
    if (existingFarm) {
      console.log('✅ Using existing farm')
      // @ts-ignore
      farm = existingFarm
    }
  } else {
    console.log('✅ Test farm created:', farm?.id)
  }

  if (farm?.id) {
    // Create pond
    const { data: pond, error: pondError } = await supabaseAdmin
      .from('ponds')
      .insert({
        farm_id: farm.id,
        name: 'Test Pond 1',
        area_ha: 1.5,
        depth_m: 1.2,
        locality: 'Bhimavaram',
        latitude: 16.5449,
        longitude: 81.5212,
      })
      .select('id')
      .single()

    if (pondError) {
      console.log('⚠️  Pond may already exist or error:', pondError.message)
    } else {
      console.log('✅ Test pond created:', pond?.id)

      // Create culture cycle
      const { data: cycle, error: cycleError } = await supabaseAdmin
        .from('culture_cycles')
        .insert({
          pond_id: pond.id,
          species: 'Litopenaeus vannamei',
          stocking_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          stocking_density: 60,
          target_harvest_days: 120,
          status: 'active',
        })
        .select('id')
        .single()

      if (cycleError) {
        console.log('⚠️  Cycle may already exist or error:', cycleError.message)
      } else {
        console.log('✅ Test culture cycle created:', cycle?.id)
      }
    }

    // Add farm_member record
    const { error: memberError } = await supabaseAdmin
      .from('farm_members')
      .upsert({
        farm_id: farm.id,
        user_id: userId,
        role: 'owner',
      })
      .select()
      .single()

    if (memberError) {
      console.log('⚠️  Farm member may already exist or error:', memberError.message)
    } else {
      console.log('✅ Farm member record created')
    }
  }

  console.log('✅ Global setup complete')
}

export default globalSetup