// Playwright authentication setup
// This runs once to sign in and save auth state for reuse across tests

import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './fixtures/test-data'

const authFile = '.auth/user.json'

setup('authenticate as test user', async ({ page }) => {
  await page.goto('/auth/signin')

  // Fill credentials (no networkidle wait - Turnstile may cause it to hang)
  await page.fill('input[type=email]', TEST_USERS.primary.email)
  await page.fill('input[type=password]', TEST_USERS.primary.password)

  // Wait for test mode captcha token to be set (useEffect in SignIn page)
  await page.waitForTimeout(1000)

  // Debug: log all console messages
  page.on('console', msg => console.log(`🌐 Console: ${msg.text()}`))
  page.on('pageerror', err => console.log(`🌐 Page Error: ${err.message}`))

  // Check if button is enabled
  const signInButton = page.locator('button:has-text("Sign in")')
  await expect(signInButton).toBeEnabled({ timeout: 10000 })

  // Click sign in
  await signInButton.click()

  // Wait for redirect to dashboard OR error message
  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 30000 }),
    page.waitForSelector('.error-message, [role="alert"]', { timeout: 30000 }).then(async () => {
      const errorText = await page.locator('.error-message, [role="alert"]').first().textContent()
      throw new Error(`Sign in failed: ${errorText}`)
    })
  ])

  // Check for any error messages
  const errorElements = page.locator('.error-message, [role="alert"]')
  const errorCount = await errorElements.count()
  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      const text = await errorElements.nth(i).textContent()
      console.log(`⚠️ Error on page: "${text}"`)
    }
  }

  // Verify we're on dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

  // Save authenticated state (cookies, localStorage, etc.)
  await page.context().storageState({ path: authFile })
  console.log('✅ Auth state saved to', authFile)
})