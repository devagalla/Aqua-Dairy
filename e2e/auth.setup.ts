// Playwright authentication setup
// This runs once to sign in and save auth state for reuse across tests

import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './fixtures/test-data'
import { createClient } from '@supabase/supabase-js'

const authFile = '.auth/user.json'

setup('authenticate as test user', async ({ page }) => {
  // Use Supabase Admin API to generate a magic link for the test user
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyxqtpzdkgtpjbsybsms.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Generate a magic link for the test user
  console.log('🔐 Generating magic link for test user...')
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_USERS.primary.email,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard',
    },
  })

  if (linkError) {
    console.error('❌ Failed to generate magic link:', linkError.message)
    throw new Error(`Failed to generate magic link: ${linkError.message}`)
  }

  console.log('✅ Magic link generated:', linkData.properties?.action_link)

  // The magic link from Supabase might have the production URL
  // Extract the token and build a local callback URL
  let magicLink = linkData.properties?.action_link || ''
  if (magicLink.includes('vercel.app')) {
    // Extract token and type from the production URL
    const url = new URL(magicLink)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type')
    if (token && type) {
      // Use token_hash parameter as expected by the callback route
      magicLink = `http://localhost:3000/auth/callback?token_hash=${token}&type=${type}&next=/dashboard`
      console.log('🔧 Rewritten magic link for local testing:', magicLink)
    }
  }

  // Navigate to the magic link
  await page.goto(magicLink)

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 })

  // Save authenticated state (cookies, localStorage, etc.)
  await page.context().storageState({ path: authFile })
  console.log('✅ Auth state saved to', authFile)
})