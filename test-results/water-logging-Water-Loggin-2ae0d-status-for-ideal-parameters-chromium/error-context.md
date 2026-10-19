# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: water-logging.spec.ts >> Water Logging & Advisor Feedback >> Water form shows optimal (green) status for ideal parameters
- Location: e2e/water-logging.spec.ts:45:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('select[name=pond_id]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('select[name=pond_id]') with timeout 10000ms
  - waiting for locator('select[name=pond_id]')

```

```yaml
- complementary:
  - link "a AquaDairy":
    - /url: /dashboard
  - text: FARM MANAGEMENT
  - navigation "Farm management":
    - link "Overview":
      - /url: /dashboard
    - link "Ponds & cycles":
      - /url: /ponds
    - link "Shrimp health":
      - /url: /health
    - link "Water quality":
      - /url: /water
    - link "Feed log":
      - /url: /feed
    - link "Growth":
      - /url: /growth
    - link "Expenses":
      - /url: /expenses
    - link "Alerts":
      - /url: /alerts
  - strong: Every detail counts.
  - text: Better data, healthier ponds.
  - button "T test-farmer Sign out":
    - text: T
    - strong: test-farmer
    - text: Sign out
- banner:
  - text: YOUR FARM, IN FOCUS Monday, October 19
  - status: All records synced
  - link "Ponds & cycles":
    - /url: /ponds
- main:
  - text: POND CONDITIONS
  - heading "Water quality" [level=1]
  - paragraph: Log the readings that keep your shrimp healthy and your water in balance.
  - text: చెరువు నీటి పరిస్థితి తెలుసుకోవడానికి ఈ రీడింగ్‌లు నమోదు చేయండి.
  - heading "Your first pond is one small step away." [level=2]
  - paragraph: Create your farm, pond, and culture cycle once. Then your records can be connected to the right shrimp.
  - link "Set up my farm":
    - /url: /onboarding
  - text: YOUR FARM JOURNAL
  - heading "Entry history" [level=2]
  - text: 0 shown
  - paragraph: Your entries will show up here.
  - text: A consistent log makes good decisions easier. Synced with your farm records
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { TEST_USERS, TEST_FARM, TEST_POND, TEST_CYCLE } from './fixtures/test-data'
  3   | 
  4   | test.describe.configure({ retries: 0 })
  5   | 
  6   | test.describe('Water Logging & Advisor Feedback', () => {
  7   |   test('Farmer can log water reading and see real-time advisor feedback (green/yellow/red)', async ({ page }) => {
  8   |     await page.goto('/water')
  9   | 
  10  |     // Wait for form to load and advisor rules to fetch
  11  |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  12  | 
  13  |     // Select a pond (first available)
  14  |     const pondOptions = page.locator('select[name=pond_id] option')
  15  |     await expect(pondOptions.first()).toBeVisible()
  16  |     await page.selectOption('select[name=pond_id]', { index: 1 })
  17  | 
  18  |     // Select culture cycle
  19  |     await expect(page.locator('select[name=culture_cycle_id]')).toBeVisible()
  20  |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  21  | 
  22  |     // Fill water parameters - test values that trigger different advisor statuses
  23  |     // pH 8.5 = HIGH (critical - red) | DO 3.2 = LOW (critical - red)
  24  |     await page.fill('input[name=ph]', '8.5')
  25  |     await page.fill('input[name=do_mg_l]', '3.2')
  26  |     await page.fill('input[name=temperature_c]', '32')
  27  |     await page.fill('input[name=salinity_ppt]', '25')
  28  |     await page.fill('input[name=ammonia_mg_l]', '0.5')
  29  |     await page.fill('input[name=nitrite_mg_l]', '0.3')
  30  | 
  31  |     // Wait for advisor feedback to render (debounced)
  32  |     await page.waitForTimeout(500)
  33  | 
  34  |     // Verify critical status indicators appear (red)
  35  |     const criticalIndicators = page.locator('[data-water-status="critical"], .status-critical, [class*="critical"]')
  36  |     await expect(criticalIndicators.first()).toBeVisible({ timeout: 5000 })
  37  | 
  38  |     // Save the reading
  39  |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  40  | 
  41  |     // Verify success toast/notification
  42  |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  43  |   })
  44  | 
  45  |   test('Water form shows optimal (green) status for ideal parameters', async ({ page }) => {
  46  |     await page.goto('/water')
> 47  |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  48  |     await page.selectOption('select[name=pond_id]', { index: 1 })
  49  |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  50  | 
  51  |     // Ideal parameters: pH 7.8-8.2, DO 5-7, Temp 28-30, Salinity 15-25
  52  |     await page.fill('input[name=ph]', '8.0')
  53  |     await page.fill('input[name=do_mg_l]', '6.0')
  54  |     await page.fill('input[name=temperature_c]', '29')
  55  |     await page.fill('input[name=salinity_ppt]', '20')
  56  |     await page.fill('input[name=ammonia_mg_l]', '0.05')
  57  |     await page.fill('input[name=nitrite_mg_l]', '0.05')
  58  | 
  59  |     await page.waitForTimeout(500)
  60  | 
  61  |     // Verify optimal/green status indicators
  62  |     const optimalIndicators = page.locator('[data-water-status="optimal"], .status-optimal, [class*="optimal"]')
  63  |     await expect(optimalIndicators.first()).toBeVisible({ timeout: 5000 })
  64  |   })
  65  | 
  66  |   test('Water form shows warning (yellow) status for borderline parameters', async ({ page }) => {
  67  |     await page.goto('/water')
  68  |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  69  |     await page.selectOption('select[name=pond_id]', { index: 1 })
  70  |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  71  | 
  72  |     // Borderline: pH 8.3 (slightly high), DO 4.5 (low but not critical)
  73  |     await page.fill('input[name=ph]', '8.3')
  74  |     await page.fill('input[name=do_mg_l]', '4.5')
  75  |     await page.fill('input[name=temperature_c]', '31')
  76  |     await page.fill('input[name=salinity_ppt]', '28')
  77  |     await page.fill('input[name=ammonia_mg_l]', '0.2')
  78  |     await page.fill('input[name=nitrite_mg_l]', '0.15')
  79  | 
  80  |     await page.waitForTimeout(500)
  81  | 
  82  |     // Verify warning/yellow status indicators
  83  |     const warningIndicators = page.locator('[data-water-status="warning"], .status-warning, [class*="warning"]')
  84  |     await expect(warningIndicators.first()).toBeVisible({ timeout: 5000 })
  85  |   })
  86  | 
  87  |   test('Water reading persists and appears in history', async ({ page }) => {
  88  |     await page.goto('/water')
  89  |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  90  |     await page.selectOption('select[name=pond_id]', { index: 1 })
  91  |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  92  | 
  93  |     await page.fill('input[name=ph]', '7.9')
  94  |     await page.fill('input[name=do_mg_l]', '5.8')
  95  |     await page.fill('input[name=temperature_c]', '28')
  96  |     await page.fill('input[name=salinity_ppt]', '18')
  97  |     await page.fill('input[name=ammonia_mg_l]', '0.02')
  98  |     await page.fill('input[name=nitrite_mg_l]', '0.02')
  99  | 
  100 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  101 |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  102 | 
  103 |     // Navigate to history/list view if available
  104 |     await page.goto('/water')
  105 |     // Verify the reading appears in history table/list
  106 |     await expect(page.locator('text=7.9').first()).toBeVisible({ timeout: 5000 })
  107 |   })
  108 | })
  109 | 
  110 | test.describe('Offline Queue & Sync', () => {
  111 |   test('Shows offline indicator when network disconnected', async ({ page }) => {
  112 |     // Check initial online status
  113 |     await expect(page.locator('text=All records synced')).toBeVisible({ timeout: 10000 })
  114 | 
  115 |     // Simulate offline
  116 |     await page.context().setOffline(true)
  117 |     await page.waitForTimeout(1000)
  118 | 
  119 |     // Verify offline indicator appears
  120 |     await expect(page.locator('text=/offline|saved on this device/i')).toBeVisible({ timeout: 5000 })
  121 | 
  122 |     // Go back online
  123 |     await page.context().setOffline(false)
  124 |     await page.waitForTimeout(2000)
  125 | 
  126 |     // Verify sync indicator
  127 |     await expect(page.locator('text=/syncing|All records synced/i')).toBeVisible({ timeout: 10000 })
  128 |   })
  129 | 
  130 |   test('Queues water reading when offline and syncs when online', async ({ page }) => {
  131 |     await page.goto('/water')
  132 |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  133 |     await page.selectOption('select[name=pond_id]', { index: 1 })
  134 |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  135 | 
  136 |     await page.fill('input[name=ph]', '7.5')
  137 |     await page.fill('input[name=do_mg_l]', '5.5')
  138 |     await page.fill('input[name=temperature_c]', '27')
  139 |     await page.fill('input[name=salinity_ppt]', '15')
  140 |     await page.fill('input[name=ammonia_mg_l]', '0.01')
  141 |     await page.fill('input[name=nitrite_mg_l]', '0.01')
  142 | 
  143 |     // Go offline
  144 |     await page.context().setOffline(true)
  145 |     await page.waitForTimeout(500)
  146 | 
  147 |     // Save while offline
```