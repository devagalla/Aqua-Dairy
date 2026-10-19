# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: water-logging.spec.ts >> Water Logging & Advisor Feedback >> Farmer can log water reading and see real-time advisor feedback (green/yellow/red)
- Location: e2e/water-logging.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('label:has-text("Pond")').locator('[role="combobox"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('label:has-text("Pond")').locator('[role="combobox"]') with timeout 10000ms
  - waiting for locator('label:has-text("Pond")').locator('[role="combobox"]')

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
  - text: చెరువు నీటి పరిస్థితి తెలుసుకోవడానికి ఈ రీడింగ్‌లు నమోదు చేయండి. NEW RECORD
  - heading "Add today's entry" [level=2]
  - text: Pond
  - combobox "Pond ఈ వివరాలు ఏ చెరువు పెంపకం బ్యాచ్‌కు చెందుతాయో ఎంచుకోండి. This record will be linked to Test Pond 1.":
    - option "Test Pond 1 · E2E Test Farm · started 2026-09-19" [selected]
  - text: ఈ వివరాలు ఏ చెరువు పెంపకం బ్యాచ్‌కు చెందుతాయో ఎంచుకోండి. This record will be linked to Test Pond 1. Reading time
  - textbox "Reading time నీటి నమూనా తీసిన తేదీ, సమయం.": 2026-10-19T01:46
  - text: నీటి నమూనా తీసిన తేదీ, సమయం. Temperature °C
  - spinbutton "Temperature °C నీటి ఉష్ణోగ్రత డిగ్రీల సెల్సియస్‌లో."
  - text: నీటి ఉష్ణోగ్రత డిగ్రీల సెల్సియస్‌లో. pH scale
  - spinbutton "pH scale నీరు ఆమ్లంగా ఉందా, క్షారంగా ఉందా తెలిపే కొలత."
  - text: నీరు ఆమ్లంగా ఉందా, క్షారంగా ఉందా తెలిపే కొలత. Dissolved oxygen mg/L
  - spinbutton "Dissolved oxygen mg/L నీటిలో కరిగి ఉన్న ఆక్సిజన్ పరిమాణం."
  - text: నీటిలో కరిగి ఉన్న ఆక్సిజన్ పరిమాణం. Salinity ppt
  - spinbutton "Salinity ppt నీటిలో ఉప్పుదనం; మీ మీటర్ చూపిన విలువ నమోదు చేయండి."
  - text: నీటిలో ఉప్పుదనం; మీ మీటర్ చూపిన విలువ నమోదు చేయండి. Ammonia mg/L
  - spinbutton "Ammonia mg/L నీటిలో అమ్మోనియా స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి."
  - text: నీటిలో అమ్మోనియా స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి. Nitrite mg/L
  - spinbutton "Nitrite mg/L నీటిలో నైట్రైట్ స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి."
  - text: నీటిలో నైట్రైట్ స్థాయి; పరీక్ష కిట్ రీడింగ్ రాయండి. Alkalinity ppm
  - spinbutton "Alkalinity ppm నీటి క్షారత్వం; పరీక్ష కిట్ చూపిన ppm విలువ."
  - text: నీటి క్షారత్వం; పరీక్ష కిట్ చూపిన ppm విలువ. Transparency cm
  - spinbutton "Transparency cm నీరు ఎంత స్పష్టంగా ఉందో సె.మీ.లో నమోదు చేయండి."
  - text: నీరు ఎంత స్పష్టంగా ఉందో సె.మీ.లో నమోదు చేయండి. Notes Optional
  - textbox "Notes Optional చెరువులో గమనించిన విషయాలు రాయండి.":
    - /placeholder: Observations from the pond…
  - text: చెరువులో గమనించిన విషయాలు రాయండి.
  - button "Save water log"
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
  4   | // Helper to interact with Radix Select (role="combobox")
  5   | async function selectRadixOption(page: import('@playwright/test').Page, labelSelector: string, optionIndex: number) {
  6   |   const combobox = page.locator(`${labelSelector} >> [role="combobox"]`)
  7   |   await combobox.click()
  8   |   // Wait for options to appear in the portal
  9   |   await page.waitForSelector('[role="option"]', { timeout: 5000 })
  10  |   const options = page.locator('[role="option"]')
  11  |   const count = await options.count()
  12  |   if (count > optionIndex) {
  13  |     await options.nth(optionIndex).click()
  14  |   } else if (count > 0) {
  15  |     await options.nth(0).click()
  16  |   }
  17  | }
  18  | 
  19  | test.describe.configure({ retries: 0 })
  20  | 
  21  | test.describe('Water Logging & Advisor Feedback', () => {
  22  |   test('Farmer can log water reading and see real-time advisor feedback (green/yellow/red)', async ({ page }) => {
  23  |     await page.goto('/water')
  24  | 
  25  |     // Wait for form to load and advisor rules to fetch
  26  |     // The pond selector uses Radix Select (button with role="combobox")
> 27  |     await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
      |                                                                               ^ Error: expect(locator).toBeVisible() failed
  28  | 
  29  |     // Select a pond using Radix Select interaction
  30  |     await selectRadixOption(page, 'label:has-text("Pond")', 1)
  31  | 
  32  |     // Fill water parameters - test values that trigger different advisor statuses
  33  |     // pH 8.5 = HIGH (critical - red) | DO 3.2 = LOW (critical - red)
  34  |     await page.fill('input[name=ph]', '8.5')
  35  |     await page.fill('input[name=do_mg_l]', '3.2')
  36  |     await page.fill('input[name=temperature_c]', '32')
  37  |     await page.fill('input[name=salinity_pps]', '25')
  38  |     await page.fill('input[name=ammonia_mg_l]', '0.5')
  39  |     await page.fill('input[name=nitrite_mg_l]', '0.3')
  40  | 
  41  |     // Wait for advisor feedback to render (debounced)
  42  |     await page.waitForTimeout(500)
  43  | 
  44  |     // Verify critical status indicators appear (red) - uses .status-red class
  45  |     const criticalIndicators = page.locator('.water-reading-status.status-red, .status-red[role="status"]')
  46  |     await expect(criticalIndicators.first()).toBeVisible({ timeout: 5000 })
  47  | 
  48  |     // Save the reading
  49  |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  50  | 
  51  |     // Verify success toast/notification
  52  |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  53  |   })
  54  | 
  55  |   test('Water form shows optimal (green) status for ideal parameters', async ({ page }) => {
  56  |     await page.goto('/water')
  57  |     await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
  58  |     await selectRadixOption(page, 'label:has-text("Pond")', 1)
  59  | 
  60  |     // Ideal parameters: pH 7.8-8.2, DO 5-7, Temp 28-30, Salinity 15-25
  61  |     await page.fill('input[name=ph]', '8.0')
  62  |     await page.fill('input[name=do_mg_l]', '6.0')
  63  |     await page.fill('input[name=temperature_c]', '29')
  64  |     await page.fill('input[name=salinity_pps]', '20')
  65  |     await page.fill('input[name=ammonia_mg_l]', '0.05')
  66  |     await page.fill('input[name=nitrite_mg_l]', '0.05')
  67  | 
  68  |     await page.waitForTimeout(500)
  69  | 
  70  |     // Verify optimal/green status indicators - uses .status-green class
  71  |     const optimalIndicators = page.locator('.water-reading-status.status-green, .status-green[role="status"]')
  72  |     await expect(optimalIndicators.first()).toBeVisible({ timeout: 5000 })
  73  |   })
  74  | 
  75  |   test('Water form shows warning (yellow) status for borderline parameters', async ({ page }) => {
  76  |     await page.goto('/water')
  77  |     await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
  78  |     await selectRadixOption(page, 'label:has-text("Pond")', 1)
  79  | 
  80  |     // Borderline: pH 8.3 (slightly high), DO 4.5 (low but not critical)
  81  |     await page.fill('input[name=ph]', '8.3')
  82  |     await page.fill('input[name=do_mg_l]', '4.5')
  83  |     await page.fill('input[name=temperature_c]', '31')
  84  |     await page.fill('input[name=salinity_pps]', '28')
  85  |     await page.fill('input[name=ammonia_mg_l]', '0.2')
  86  |     await page.fill('input[name=nitrite_mg_l]', '0.15')
  87  | 
  88  |     await page.waitForTimeout(500)
  89  | 
  90  |     // Verify warning/yellow status indicators - uses .status-yellow class
  91  |     const warningIndicators = page.locator('.water-reading-status.status-yellow, .status-yellow[role="status"]')
  92  |     await expect(warningIndicators.first()).toBeVisible({ timeout: 5000 })
  93  |   })
  94  | 
  95  |   test('Water reading persists and appears in history', async ({ page }) => {
  96  |     await page.goto('/water')
  97  |     await expect(page.locator('label:has-text("Pond") >> [role="combobox"]')).toBeVisible({ timeout: 10000 })
  98  |     await selectRadixOption(page, 'label:has-text("Pond")', 1)
  99  | 
  100 |     await page.fill('input[name=ph]', '7.9')
  101 |     await page.fill('input[name=do_mg_l]', '5.8')
  102 |     await page.fill('input[name=temperature_c]', '28')
  103 |     await page.fill('input[name=salinity_pps]', '18')
  104 |     await page.fill('input[name=ammonia_mg_l]', '0.02')
  105 |     await page.fill('input[name=nitrite_mg_l]', '0.02')
  106 | 
  107 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  108 |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  109 | 
  110 |     // Navigate to history/list view if available
  111 |     await page.goto('/water')
  112 |     // Verify the reading appears in history table/list
  113 |     await expect(page.locator('text=7.9').first()).toBeVisible({ timeout: 5000 })
  114 |   })
  115 | })
  116 | 
  117 | test.describe('Offline Queue & Sync', () => {
  118 |   test('Shows offline indicator when network disconnected', async ({ page }) => {
  119 |     // Check initial online status
  120 |     await expect(page.locator('text=All records synced')).toBeVisible({ timeout: 10000 })
  121 | 
  122 |     // Simulate offline
  123 |     await page.context().setOffline(true)
  124 |     await page.waitForTimeout(1000)
  125 | 
  126 |     // Verify offline indicator appears
  127 |     await expect(page.locator('text=/offline|saved on this device/i')).toBeVisible({ timeout: 5000 })
```