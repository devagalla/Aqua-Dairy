# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: water-logging.spec.ts >> Offline Queue & Sync >> Queues water reading when offline and syncs when online
- Location: e2e/water-logging.spec.ts:130:7

# Error details

```
Error: Channel closed
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('select[name=pond_id]')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('select[name=pond_id]') with timeout 10000ms
  - waiting for locator('select[name=pond_id]')
  - Test ended.

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
  47  |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
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
> 132 |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
      |                                                        ^ Error: expect(locator).toBeVisible() failed
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
  148 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  149 | 
  150 |     // Should show saved locally message or remain on page
  151 |     await expect(page.locator('text=/saved|queued|offline/i')).toBeVisible({ timeout: 10000 })
  152 | 
  153 |     // Go back online
  154 |     await page.context().setOffline(false)
  155 |     await page.waitForTimeout(3000)
  156 | 
  157 |     // Should sync automatically
  158 |     await expect(page.locator('text=/synced|sync complete/i')).toBeVisible({ timeout: 15000 })
  159 |   })
  160 | })
  161 | 
  162 | test.describe('Navigation & Core Flows', () => {
  163 |   test('Dashboard loads with farm stats', async ({ page }) => {
  164 |     await expect(page.locator('text=/ponds?|farm/i')).toBeVisible({ timeout: 10000 })
  165 |     await expect(page.locator('text=/active cycles?/i')).toBeVisible()
  166 |   })
  167 | 
  168 |   test('Can navigate to all main sections from sidebar', async ({ page }) => {
  169 |     const sections = [
  170 |       { href: '/water', label: 'Water quality' },
  171 |       { href: '/feed', label: 'Feed log' },
  172 |       { href: '/growth', label: 'Growth' },
  173 |       { href: '/expenses', label: 'Expenses' },
  174 |       { href: '/alerts', label: 'Alerts' },
  175 |       { href: '/health', label: 'Shrimp health' },
  176 |       { href: '/ponds', label: 'Ponds & cycles' },
  177 |     ]
  178 | 
  179 |     for (const section of sections) {
  180 |       await page.goto(section.href)
  181 |       await expect(page).toHaveURL(new RegExp(section.href))
  182 |       await page.waitForTimeout(500)
  183 |     }
  184 |   })
  185 | 
  186 |   test('Feed logging works with feed tray observation', async ({ page }) => {
  187 |     await page.goto('/feed')
  188 |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  189 |     await page.selectOption('select[name=pond_id]', { index: 1 })
  190 |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  191 | 
  192 |     await page.fill('input[name=feed_type]', 'CP 35%')
  193 |     await page.fill('input[name=amount_kg]', '25')
  194 |     await page.fill('input[name=feed_tray_observation]', 'Good consumption, minimal waste')
  195 | 
  196 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  197 |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  198 |   })
  199 | 
  200 |   test('Growth sampling works with biomass calculation', async ({ page }) => {
  201 |     await page.goto('/growth')
  202 |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  203 |     await page.selectOption('select[name=pond_id]', { index: 1 })
  204 |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  205 | 
  206 |     await page.fill('input[name=sample_count]', '50')
  207 |     await page.fill('input[name=total_weight_g]', '1250')
  208 |     await page.fill('input[name=average_weight_g]', '25')
  209 | 
  210 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  211 |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  212 |   })
  213 | 
  214 |   test('Expense logging works', async ({ page }) => {
  215 |     await page.goto('/expenses')
  216 |     await expect(page.locator('select[name=pond_id]')).toBeVisible({ timeout: 10000 })
  217 |     await page.selectOption('select[name=pond_id]', { index: 1 })
  218 |     await page.selectOption('select[name=culture_cycle_id]', { index: 1 })
  219 | 
  220 |     await page.fill('input[name=category]', 'Feed')
  221 |     await page.fill('input[name=amount]', '15000')
  222 |     await page.fill('input[name=description]', 'Monthly feed purchase')
  223 | 
  224 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  225 |     await expect(page.locator('text=/saved|recorded|logged/i')).toBeVisible({ timeout: 10000 })
  226 |   })
  227 | })
  228 | 
  229 | test.describe('Alerts', () => {
  230 |   test('Alerts page loads and shows severity colors', async ({ page }) => {
  231 |     await page.goto('/alerts')
  232 |     await expect(page.locator('text=/alerts?/i')).toBeVisible({ timeout: 10000 })
```