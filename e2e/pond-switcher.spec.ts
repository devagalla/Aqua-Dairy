import { test, expect } from '@playwright/test'

test.describe('Global Pond Switcher', () => {
  test('User can switch ponds globally via pill strip and persist selection', async ({ page }) => {
    // 1. Authenticate (the auth.setup.ts handled this via storageState)
    await page.goto('/dashboard')

    // 2. Locate the global pond switcher pill strip
    const switcher = page.locator('.global-pond-switcher')
    await expect(switcher).toBeVisible({ timeout: 10000 })

    // 3. Select the second pond if it exists
    const pills = switcher.locator('.switcher-pill')
    const count = await pills.count()
    if (count > 1) {
      const firstPondName = await pills.nth(0).locator('strong').textContent()
      const secondPondPill = pills.nth(1)
      const secondPondName = await secondPondPill.locator('strong').textContent()

      await secondPondPill.click()
      await expect(secondPondPill).toHaveClass(/active/)

      // Verify local storage updated (by checking page navigation persists it)
      await page.goto('/pond-log')
      const activeSwitcher = page.locator('.switcher-pill.active')
      await expect(activeSwitcher.locator('strong')).toHaveText(secondPondName!)
    }
  })
})
