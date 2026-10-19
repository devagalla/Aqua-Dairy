# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate as test user
- Location: e2e/auth.setup.ts:9:6

# Error details

```
Error: Sign in failed: 
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - link "a Aqua Dairy" [ref=e3] [cursor=pointer]:
      - /url: /
      - generic [ref=e4]: a
      - text: Aqua
      - generic [ref=e5]: Dairy
    - generic [ref=e6]:
      - text: WELCOME BACK
      - heading "Good to have you back." [level=1] [ref=e7]
      - paragraph [ref=e8]: Your ponds have a story to tell. Pick up right where you left off.
      - generic [ref=e9]: మీ చెరువు వివరాలు కొనసాగించడానికి మీ ఖాతాలోకి ప్రవేశించండి.
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Email address
          - textbox "Email address ఖాతా తెరిచేటప్పుడు వాడిన ఈమెయిల్ నమోదు చేయండి." [ref=e13]:
            - /placeholder: you@yourfarm.com
            - text: test-farmer@aquadairy.local
          - generic [ref=e14]: ఖాతా తెరిచేటప్పుడు వాడిన ఈమెయిల్ నమోదు చేయండి.
        - generic [ref=e15]:
          - generic [ref=e16]: Password
          - textbox "Password మీ ఖాతా పాస్‌వర్డ్ నమోదు చేయండి." [ref=e17]:
            - /placeholder: Your password
            - text: TestPass123!
          - generic [ref=e18]: మీ ఖాతా పాస్‌వర్డ్ నమోదు చేయండి.
        - button "Signing you in…" [disabled]:
          - text: Signing you in…
          - generic [aria-hidden]: →
      - paragraph [ref=e19]:
        - text: New to Aqua Dairy?
        - link "Create an account" [ref=e20] [cursor=pointer]:
          - /url: /auth/signup
    - paragraph [ref=e21]: Thoughtful farm management, from first stocking to harvest.
  - alert [ref=e22]
```

# Test source

```ts
  1  | // Playwright authentication setup
  2  | // This runs once to sign in and save auth state for reuse across tests
  3  | 
  4  | import { test as setup, expect } from '@playwright/test'
  5  | import { TEST_USERS } from './fixtures/test-data'
  6  | 
  7  | const authFile = '.auth/user.json'
  8  | 
  9  | setup('authenticate as test user', async ({ page }) => {
  10 |   await page.goto('/auth/signin')
  11 | 
  12 |   // Fill credentials (no networkidle wait - Turnstile may cause it to hang)
  13 |   await page.fill('input[type=email]', TEST_USERS.primary.email)
  14 |   await page.fill('input[type=password]', TEST_USERS.primary.password)
  15 | 
  16 |   // Wait for test mode captcha token to be set (useEffect in SignIn page)
  17 |   await page.waitForTimeout(1000)
  18 | 
  19 |   // Debug: log all console messages
  20 |   page.on('console', msg => console.log(`🌐 Console: ${msg.text()}`))
  21 |   page.on('pageerror', err => console.log(`🌐 Page Error: ${err.message}`))
  22 | 
  23 |   // Check if button is enabled
  24 |   const signInButton = page.locator('button:has-text("Sign in")')
  25 |   await expect(signInButton).toBeEnabled({ timeout: 10000 })
  26 | 
  27 |   // Click sign in
  28 |   await signInButton.click()
  29 | 
  30 |   // Wait for redirect to dashboard OR error message
  31 |   await Promise.race([
  32 |     page.waitForURL(/\/dashboard/, { timeout: 30000 }),
  33 |     page.waitForSelector('.error-message, [role="alert"]', { timeout: 30000 }).then(async () => {
  34 |       const errorText = await page.locator('.error-message, [role="alert"]').first().textContent()
> 35 |       throw new Error(`Sign in failed: ${errorText}`)
     |             ^ Error: Sign in failed: 
  36 |     })
  37 |   ])
  38 | 
  39 |   // Check for any error messages
  40 |   const errorElements = page.locator('.error-message, [role="alert"]')
  41 |   const errorCount = await errorElements.count()
  42 |   if (errorCount > 0) {
  43 |     for (let i = 0; i < errorCount; i++) {
  44 |       const text = await errorElements.nth(i).textContent()
  45 |       console.log(`⚠️ Error on page: "${text}"`)
  46 |     }
  47 |   }
  48 | 
  49 |   // Verify we're on dashboard
  50 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  51 | 
  52 |   // Save authenticated state (cookies, localStorage, etc.)
  53 |   await page.context().storageState({ path: authFile })
  54 |   console.log('✅ Auth state saved to', authFile)
  55 | })
```