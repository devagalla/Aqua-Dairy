# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as test user
- Location: e2e/auth.setup.ts:10:6

# Error details

```
Error: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy) environment variable is required
```

# Test source

```ts
  1  | // Playwright authentication setup
  2  | // This runs once to sign in and save auth state for reuse across tests
  3  | 
  4  | import { test as setup, expect } from '@playwright/test'
  5  | import { TEST_USERS } from './fixtures/test-data'
  6  | import { createClient } from '@supabase/supabase-js'
  7  | 
  8  | const authFile = '.auth/user.json'
  9  | 
  10 | setup('authenticate as test user', async ({ page }) => {
  11 |   // Use Supabase Admin API to generate a magic link for the test user
  12 |   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyxqtpzdkgtpjbsybsms.supabase.co'
  13 |   const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  14 |   
  15 |   if (!serviceRoleKey) {
> 16 |     throw new Error('SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy) environment variable is required')
     |           ^ Error: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy) environment variable is required
  17 |   }
  18 | 
  19 |   const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  20 |     auth: {
  21 |       autoRefreshToken: false,
  22 |       persistSession: false,
  23 |     },
  24 |   })
  25 | 
  26 |   // Generate a magic link for the test user
  27 |   console.log('🔐 Generating magic link for test user...')
  28 |   const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
  29 |     type: 'magiclink',
  30 |     email: TEST_USERS.primary.email,
  31 |     options: {
  32 |       redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard',
  33 |     },
  34 |   })
  35 | 
  36 |   if (linkError) {
  37 |     console.error('❌ Failed to generate magic link:', linkError.message)
  38 |     throw new Error(`Failed to generate magic link: ${linkError.message}`)
  39 |   }
  40 | 
  41 |   console.log('✅ Magic link generated:', linkData.properties?.action_link)
  42 | 
  43 |   // The magic link from Supabase might have the production URL
  44 |   // Extract the token and build a local callback URL
  45 |   let magicLink = linkData.properties?.action_link || ''
  46 |   if (magicLink.includes('vercel.app')) {
  47 |     // Extract token and type from the production URL
  48 |     const url = new URL(magicLink)
  49 |     const token = url.searchParams.get('token')
  50 |     const type = url.searchParams.get('type')
  51 |     if (token && type) {
  52 |       // Use token_hash parameter as expected by the callback route
  53 |       magicLink = `http://localhost:3000/auth/callback?token_hash=${token}&type=${type}&next=/dashboard`
  54 |       console.log('🔧 Rewritten magic link for local testing:', magicLink)
  55 |     }
  56 |   }
  57 | 
  58 |   // Navigate to the magic link
  59 |   await page.goto(magicLink)
  60 | 
  61 |   // Wait for redirect to dashboard
  62 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 })
  63 | 
  64 |   // Save authenticated state (cookies, localStorage, etc.)
  65 |   await page.context().storageState({ path: authFile })
  66 |   console.log('✅ Auth state saved to', authFile)
  67 | })
```