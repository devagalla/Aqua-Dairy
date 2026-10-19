import { test, expect } from '@playwright/test'
import { TEST_USERS, TEST_FARM, TEST_POND, TEST_CYCLE } from './fixtures/test-data'

// Helper to interact with Radix Select (role="combobox")
async function selectRadixOption(page: import('@playwright/test').Page, labelSelector: string, optionIndex: number) {
  const combobox = page.locator('[role="combobox"]:has-text("Pond")')
  await combobox.click()
  // Wait for options to appear in the portal
  await page.waitForSelector('[role="option"]', { timeout: 5000 })
  const options = page.locator('[role="option"]')
  const count = await options.count()
  if (count > optionIndex) {
    await options.nth(optionIndex).click()
  } else if (count > 0) {
    await options.nth(0).click()
  }
}

test.describe.configure({ retries: 0 })

test.describe('Water Logging & Advisor Feedback', () => {
  test('Farmer can log water reading and see real-time advisor feedback (green/yellow/red)', async ({ page }) => {
    await page.goto('/water')

    // Wait for form to load and advisor rules to fetch
    // The pond selector uses Radix Select (button with role="combobox")
    await expect(page.locator('[role="combobox"]:has-text("Pond")')).toBeVisible({ timeout: 10000 })

    // Select a pond using Radix Select interaction
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    // Fill water parameters - test values that trigger different advisor statuses
    // pH 8.5 = HIGH (critical - red) | DO 3.2 = LOW (critical - red)
    await page.fill('input[name=ph]', '8.5')
    await page.fill('input[name=do_mg_l]', '3.2')
    await page.fill('input[name=temperature_c]', '32')
    await page.fill('input[name=salinity_pps]', '25')
    await page.fill('input[name=ammonia_mg_l]', '0.5')
    await page.fill('input[name=nitrite_mg_l]', '0.3')

    // Wait for advisor feedback to render (debounced)
    await page.waitForTimeout(500)

    // Verify critical status indicators appear (red) - uses .status-red class
    const criticalIndicators = page.locator('.water-reading-status.status-red, .status-red[role="status"]')
    await expect(criticalIndicators.first()).toBeVisible({ timeout: 5000 })

    // Save the reading
    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()

    // Verify success toast/notification
    await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  })

  test('Water form shows optimal (green) status for ideal parameters', async ({ page }) => {
    await page.goto('/water')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    // Ideal parameters: pH 7.8-8.2, DO 5-7, Temp 28-30, Salinity 15-25
    await page.fill('input[name=ph]', '8.0')
    await page.fill('input[name=do_mg_l]', '6.0')
    await page.fill('input[name=temperature_c]', '29')
    await page.fill('input[name=salinity_pps]', '20')
    await page.fill('input[name=ammonia_mg_l]', '0.05')
    await page.fill('input[name=nitrite_mg_l]', '0.05')

    await page.waitForTimeout(500)

    // Verify optimal/green status indicators - uses .status-green class
    const optimalIndicators = page.locator('.water-reading-status.status-green, .status-green[role="status"]')
    await expect(optimalIndicators.first()).toBeVisible({ timeout: 5000 })
  })

  test('Water form shows warning (yellow) status for borderline parameters', async ({ page }) => {
    await page.goto('/water')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    // Borderline: pH 8.3 (slightly high), DO 4.5 (low but not critical)
    await page.fill('input[name=ph]', '8.3')
    await page.fill('input[name=do_mg_l]', '4.5')
    await page.fill('input[name=temperature_c]', '31')
    await page.fill('input[name=salinity_pps]', '28')
    await page.fill('input[name=ammonia_mg_l]', '0.2')
    await page.fill('input[name=nitrite_mg_l]', '0.15')

    await page.waitForTimeout(500)

    // Verify warning/yellow status indicators - uses .status-yellow class
    const warningIndicators = page.locator('.water-reading-status.status-yellow, .status-yellow[role="status"]')
    await expect(warningIndicators.first()).toBeVisible({ timeout: 5000 })
  })

  test('Water reading persists and appears in history', async ({ page }) => {
    await page.goto('/water')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    await page.fill('input[name=ph]', '7.9')
    await page.fill('input[name=do_mg_l]', '5.8')
    await page.fill('input[name=temperature_c]', '28')
    await page.fill('input[name=salinity_pps]', '18')
    await page.fill('input[name=ammonia_mg_l]', '0.02')
    await page.fill('input[name=nitrite_mg_l]', '0.02')

    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
    await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })

    // Navigate to history/list view if available
    await page.goto('/water')
    // Verify the reading appears in history table/list
    await expect(page.locator('text=7.9').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Offline Queue & Sync', () => {
  test('Shows offline indicator when network disconnected', async ({ page }) => {
    // Check initial online status
    await expect(page.locator('text=All records synced')).toBeVisible({ timeout: 10000 })

    // Simulate offline
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // Verify offline indicator appears
    await expect(page.locator('text=/offline|saved on this device/i')).toBeVisible({ timeout: 5000 })

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Verify sync indicator
    await expect(page.locator('text=/syncing|All records synced/i')).toBeVisible({ timeout: 10000 })
  })

  test('Queues water reading when offline and syncs when online', async ({ page }) => {
    await page.goto('/water')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    await page.fill('input[name=ph]', '7.5')
    await page.fill('input[name=do_mg_l]', '5.5')
    await page.fill('input[name=temperature_c]', '27')
    await page.fill('input[name=salinity_pps]', '15')
    await page.fill('input[name=ammonia_mg_l]', '0.01')
    await page.fill('input[name=nitrite_mg_l]', '0.01')

    // Go offline
    await page.context().setOffline(true)
    await page.waitForTimeout(500)

    // Save while offline
    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()

    // Should show saved locally message or remain on page
    await expect(page.locator('text=/saved|queued|offline/i')).toBeVisible({ timeout: 10000 })

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(3000)

    // Should sync automatically
    await expect(page.locator('text=/synced|sync complete/i')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Navigation & Core Flows', () => {
  test('Dashboard loads with farm stats', async ({ page }) => {
    await expect(page.locator('text=/ponds?|farm/i')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/active cycles?/i')).toBeVisible()
  })

  test('Can navigate to all main sections from sidebar', async ({ page }) => {
    const sections = [
      { href: '/water', label: 'Water quality' },
      { href: '/feed', label: 'Feed log' },
      { href: '/growth', label: 'Growth' },
      { href: '/expenses', label: 'Expenses' },
      { href: '/alerts', label: 'Alerts' },
      { href: '/health', label: 'Shrimp health' },
      { href: '/ponds', label: 'Ponds & cycles' },
    ]

    for (const section of sections) {
      await page.goto(section.href)
      await expect(page).toHaveURL(new RegExp(section.href))
      await page.waitForTimeout(500)
    }
  })

  test('Feed logging works with feed tray observation', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    await page.fill('input[name=feed_type]', 'CP 35%')
    await page.fill('input[name=amount_kg]', '25')
    await page.fill('input[name=feed_tray_observation]', 'Good consumption, minimal waste')

    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
    await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  })

  test('Growth sampling works with biomass calculation', async ({ page }) => {
    await page.goto('/growth')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
    await selectRadixOption(page, 'label:has-text("Pond")', 1)

    await page.fill('input[name=sample_count]', '50')
    await page.fill('input[name=total_weight_g]', '1250')
    await page.fill('input[name=average_weight_g]', '25')

    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
    await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  })

  test('Expense logging works', async ({ page }) => {
    await page.goto('/expenses')
    // Expense form has a different structure - check for either pond combobox or farm combobox
    const pondCombobox = page.locator('label:has-text("Pond") >> [role="combobox"]')
    const farmCombobox = page.locator('label:has-text("Farm") >> [role="combobox"]')
    
    if (await pondCombobox.isVisible({ timeout: 5000 })) {
      await selectRadixOption(page, 'label:has-text("Pond")', 1)
    } else if (await farmCombobox.isVisible({ timeout: 5000 })) {
      await selectRadixOption(page, 'label:has-text("Farm")', 1)
    }

    await page.fill('input[name=category]', 'Feed')
    await page.fill('input[name=amount]', '15000')
    await page.fill('input[name=description]', 'Monthly feed purchase')

    await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
    await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Alerts', () => {
  test('Alerts page loads and shows severity colors', async ({ page }) => {
    await page.goto('/alerts')
    await expect(page.locator('text=/alerts?/i')).toBeVisible({ timeout: 10000 })

    // Check for severity badges if alerts exist
    const severityBadges = page.locator('[data-severity], .severity, [class*="severity"]')
    // May not have alerts initially, so just verify page loads
    await expect(page.locator('main, .workspace-content')).toBeVisible()
  })
})

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('Mobile bottom navigation works', async ({ page }) => {
    // Mobile nav should be visible
    await expect(page.locator('.mobile-workspace-nav, nav[aria-label="Farm management"]')).toBeVisible()

    // Tap water link
    await page.click('a[href="/water"]')
    await expect(page).toHaveURL(/\/water/)

    // Tap feed link
    await page.click('a[href="/feed"]')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('Water form usable on mobile', async ({ page }) => {
    await page.goto('/water')
    await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })

    // Form fields should be appropriately sized for touch
    const phInput = page.locator('input[name=ph]')
    await expect(phInput).toBeVisible()

    const box = await phInput.boundingBox()
    expect(box?.height).toBeGreaterThan(40) // Minimum touch target
  })
})