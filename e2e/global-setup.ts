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
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

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

  // Try to use the database function first (handles RLS and constraints properly)
  let farmData = null
  let farmError = null

  try {
    const result = await supabaseAdmin.rpc('create_initial_farm', {
      farm_name_input: 'E2E Test Farm',
      region_input: 'West Godavari, Andhra Pradesh',
      pond_name_input: 'Test Pond 1',
      area_acres_input: 1.5,
      seed_stocked_input: 60000,
      stocking_date_input: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      pl_input: '10',
      target_harvest_days_input: 120,
      locality_input: 'Bhimavaram',
      latitude_input: 16.5449,
      longitude_input: 81.5212,
    })
    farmData = result.data
    farmError = result.error
  } catch (err) {
    farmError = err
  }

  if (farmError) {
    // Function might not exist in remote DB, fall back to manual creation
    console.log('⚠️  Farm function not available, creating manually:', (farmError as { message?: string }).message || farmError)
    
    // Check if farm already exists for this user
    const { data: existingFarm } = await supabaseAdmin
      .from('farms')
      .select('id')
      .eq('owner_id', userId)
      .single()

    let farmId = existingFarm?.id

    if (!farmId) {
      // Create farm manually
      const { data: newFarm, error: createFarmError } = await supabaseAdmin
        .from('farms')
        .insert({
          name: 'E2E Test Farm',
          region: 'West Godavari, Andhra Pradesh',
          owner_id: userId,
        })
        .select('id')
        .single()

      if (createFarmError) {
        console.log('⚠️  Farm creation error:', (createFarmError as { message?: string }).message)
      } else {
        farmId = newFarm?.id
        console.log('✅ Test farm created:', farmId)
      }
    } else {
      console.log('✅ Using existing farm:', farmId)
    }

    if (farmId) {
      // Create farm_member record (role must be 'Farmer', 'Manager', or 'Admin' per check constraint)
      const { error: memberError } = await supabaseAdmin
        .from('farm_members')
        .upsert({
          farm_id: farmId,
          user_id: userId,
          role: 'Farmer',
        })
        .select()
        .single()

      if (memberError) {
        console.log('⚠️  Farm member may already exist or error:', memberError.message)
      } else {
        console.log('✅ Farm member record created/updated')
      }

      // Check for existing pond
      const { data: existingPond } = await supabaseAdmin
        .from('ponds')
        .select('id')
        .eq('farm_id', farmId)
        .single()

      let pondId = existingPond?.id

      if (!pondId) {
        // Create pond manually (no depth_m column in schema)
        const { data: newPond, error: createPondError } = await supabaseAdmin
          .from('ponds')
          .insert({
            farm_id: farmId,
            name: 'Test Pond 1',
            area_acres: 1.5,
            locality: 'Bhimavaram',
            latitude: 16.5449,
            longitude: 81.5212,
          })
          .select('id')
          .single()

        if (createPondError) {
          console.log('⚠️  Pond creation error:', (createPondError as { message?: string }).message)
        } else {
          pondId = newPond?.id
          console.log('✅ Test pond created:', pondId)
        }
      } else {
        console.log('✅ Using existing pond:', pondId)
      }

      if (pondId) {
        // Check for existing active cycle
        const { data: existingCycle } = await supabaseAdmin
          .from('culture_cycles')
          .select('id')
          .eq('pond_id', pondId)
          .eq('status', 'active')
          .single()

        if (!existingCycle) {
          // Create culture cycle manually (no species column in schema)
          const { data: newCycle, error: createCycleError } = await supabaseAdmin
            .from('culture_cycles')
            .insert({
              pond_id: pondId,
              stocking_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
              seed_stocked: 60000,
              pl: '10',
              target_harvest_days: 120,
              status: 'active',
            })
            .select('id')
            .single()

          if (createCycleError) {
            console.log('⚠️  Cycle creation error:', createCycleError.message)
          } else {
            console.log('✅ Test culture cycle created:', newCycle?.id)
          }
        } else {
          console.log('✅ Using existing culture cycle:', existingCycle.id)
        }
      }
    }
  } else {
    console.log('✅ Test farm, pond, and culture cycle created via function:', farmData)
  }

  console.log('✅ Global setup complete')
}

export default globalSetup