# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: water-logging.spec.ts >> Mobile Responsive >> Mobile bottom navigation works
- Location: e2e/water-logging.spec.ts:216:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('aside, nav').first()
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" locator('aside, nav').first() with timeout 5000ms
  - waiting for locator('aside, nav').first()
    14 × locator resolved to <aside class="workspace-sidebar">…</aside>
       - unexpected value "hidden"

```

```yaml
- banner:
  - text: Monday, October 19
  - status: All records synced
  - link "Ponds & cycles":
    - /url: /ponds
- main:
  - text: YOUR FARM AT A GLANCE
  - heading "Good to see you at E2E Test Farm." [level=1]
  - paragraph: Small observations today make stronger harvests tomorrow.
  - text: ఈరోజు చేసే చిన్న గమనింపులే రేపటి మంచి దిగుబడికి తోడ్పడతాయి.
  - link "Manage ponds & cycles":
    - /url: /ponds
  - text: WEATHER NEAR YOUR PONDS
  - heading "Local conditions & forecast" [level=2]
  - text: మీ చెరువు దగ్గరి ప్రస్తుత వాతావరణం, రాబోయే ఏడు రోజుల అంచనా. OPEN-METEO ↗
  - article:
    - strong: Test Pond 1
    - text: E2E Test Farm · Bhimavaram
    - strong: 25°
    - text: Partly cloudy Feels like 29° Updated today at 02:45 local time Humidity 88% Wind 10 km/h Rain now 0 mm Cloud cover 27% Solar radiation 0 W/m²
    - strong: Today
    - text: Rain showers 31° / 25° 84% rain 5.3 mm · 66% clouds 18 Wh/m² solar
    - strong: Wed
    - text: Drizzle 30° / 25° 47% rain 0.6 mm · 94% clouds 17 Wh/m² solar
    - strong: Thu
    - text: Thunderstorm 30° / 25° 60% rain 2.9 mm · 81% clouds 15 Wh/m² solar
    - strong: Fri
    - text: Drizzle 31° / 24° 17% rain 0.3 mm · 42% clouds 19 Wh/m² solar
    - strong: Sat
    - text: Clear sky 32° / 24° 8% rain 0.0 mm · 3% clouds 20 Wh/m² solar
    - strong: Sun
    - text: Partly cloudy 32° / 23° 20% rain 0.0 mm · 41% clouds 20 Wh/m² solar
    - strong: Mon
    - text: Partly cloudy 31° / 23° 12% rain 0.0 mm · 100% clouds 21 Wh/m² solar
    - group: Yesterday · 2026-10-19
  - paragraph:
    - text: Current conditions and forecast by
    - link "Open-Meteo":
      - /url: https://open-meteo.com/
    - text: ", refreshed on load. The expandable hourly view shows yesterday's historical weather for the saved pond location."
  - region "Farm summary":
    - article:
      - text: Ponds చెరువులు
      - strong: "01"
      - text: in your farms
    - article:
      - text: Active cycles ప్రస్తుతం ఉన్న పెంపకం బ్యాచ్‌లు
      - strong: "01"
      - text: batches currently being raised
    - article:
      - text: Latest pH నీటి కొలత
      - strong: "7.9"
      - text: checked 10/19/2026
    - article:
      - text: Average weight సగటు బరువు
      - strong: 25g
      - text: latest sample
  - text: A GOOD DAY STARTS WITH A GOOD LOG
  - heading "What would you like to record?" [level=2]
  - text: YOUR DAILY TOOLS ↘
  - link "Shrimp photo check Screen a photo on this device.":
    - /url: /health
    - strong: Shrimp photo check
    - text: Screen a photo on this device.
  - link "Water quality Check what your pond is telling you.":
    - /url: /water
    - strong: Water quality
    - text: Check what your pond is telling you.
  - link "Feed log Keep daily feedings on track.":
    - /url: /feed
    - strong: Feed log
    - text: Keep daily feedings on track.
  - link "Growth samples Follow weight gain over time.":
    - /url: /growth
    - strong: Growth samples
    - text: Follow weight gain over time.
  - link "Farm expenses Understand where costs go.":
    - /url: /expenses
    - strong: Farm expenses
    - text: Understand where costs go.
  - article:
    - text: POND HEALTH
    - heading "Latest water reading" [level=2]
    - text: ◌ 7.9pH 5.8mg/L oxygen 10/19/2026, 5:25:00 PM
    - link "Log water quality":
      - /url: /water
  - article:
    - text: KEEP MOMENTUM
    - heading "Your farm journal" [level=2]
    - text: ✳
    - paragraph: Record feed, growth, and expenses as they happen. Your entries will build a history you can act on. మేత, రొయ్యల ఎదుగుదల, ఖర్చులు జరిగినప్పుడే నమోదు చేయండి. తర్వాత మొత్తం వివరాలు సులభంగా చూసుకోవచ్చు.
    - link "Add a feeding":
      - /url: /feed
- navigation "Farm management":
  - link "Pond Log":
    - /url: /pond-log
  - link "Feed & Trays":
    - /url: /feed-trays
  - link "Market Prices":
    - /url: /market-prices
  - link "Shrimp Health":
    - /url: /health
- alert
```

# Test source

```ts
  118 |     await page.waitForTimeout(2000)
  119 |   })
  120 | 
  121 |   test('Queues water reading when offline and syncs when online', async ({ page }) => {
  122 |     await page.goto('/water')
  123 |     await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 })
  124 |     await page.locator('select').first().selectOption({ index: 0 })
  125 | 
  126 |     await page.fill('input[name=pH]', '7.5')
  127 |     await page.fill('input[name=do_mg_l]', '5.5')
  128 |     await page.fill('input[name=temperature_c]', '27')
  129 |     await page.fill('input[name=salinity_pps]', '15')
  130 |     await page.fill('input[name=ammonia_mg_l]', '0.01')
  131 |     await page.fill('input[name=nitrite_mg_l]', '0.01')
  132 | 
  133 |     // Go offline
  134 |     await page.context().setOffline(true)
  135 |     await page.waitForTimeout(500)
  136 | 
  137 |     // Save while offline
  138 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  139 | 
  140 |     // Should show saved locally message or remain on page
  141 |     await expect(page.locator('text=/saved|queued|offline/i')).toBeVisible({ timeout: 10000 }).catch(() => {})
  142 | 
  143 |     // Go back online
  144 |     await page.context().setOffline(false)
  145 |     await page.waitForTimeout(3000)
  146 |   })
  147 | })
  148 | 
  149 | test.describe('Navigation & Core Flows', () => {
  150 |   test('Dashboard loads with farm stats', async ({ page }) => {
  151 |     await page.goto('/dashboard')
  152 |     await expect(page.locator('text=/ponds?|farm/i').first()).toBeVisible({ timeout: 10000 })
  153 |   })
  154 | 
  155 |   test('Can navigate to main sections', async ({ page }) => {
  156 |     await page.goto('/water')
  157 |     await expect(page).toHaveURL(/\/water/)
  158 |     await page.goto('/feed')
  159 |     await expect(page).toHaveURL(/\/feed/)
  160 |     await page.goto('/growth')
  161 |     await expect(page).toHaveURL(/\/growth/)
  162 |   })
  163 | 
  164 |   test('Feed logging works with feed tray observation', async ({ page }) => {
  165 |     await page.goto('/feed')
  166 |     await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 })
  167 |     await page.locator('select').first().selectOption({ index: 0 })
  168 | 
  169 |     await page.fill('input[name=feed_type]', 'CP 35%')
  170 |     await page.fill('input[name=amount_kg]', '25')
  171 | 
  172 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  173 |     await expect(page.locator('.form-message.success-message')).toBeVisible({ timeout: 10000 })
  174 |   })
  175 | 
  176 |   test('Growth sampling works with biomass calculation', async ({ page }) => {
  177 |     await page.goto('/growth')
  178 |     await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 })
  179 |     await page.locator('select').first().selectOption({ index: 0 })
  180 | 
  181 |     await page.fill('input[name=average_weight_g]', '25')
  182 |     await page.fill('input[name=sample_size]', '50')
  183 | 
  184 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  185 |     await expect(page.locator('.form-message.success-message')).toBeVisible({ timeout: 10000 })
  186 |   })
  187 | 
  188 |   test('Expense logging works', async ({ page }) => {
  189 |     await page.goto('/expenses')
  190 |     await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 })
  191 |     await page.locator('select').first().selectOption({ index: 0 })
  192 | 
  193 |     const categorySelect = page.locator('select[name="category"]')
  194 |     if (await categorySelect.isVisible()) {
  195 |       await categorySelect.selectOption({ index: 1 })
  196 |     }
  197 | 
  198 |     await page.fill('input[name=amount]', '15000')
  199 |     await page.fill('input[name=description]', 'Monthly feed purchase')
  200 | 
  201 |     await page.locator('button:has-text("Save"), button:has-text("Log"), button[type=submit]').first().click()
  202 |     await expect(page.locator('.form-message.success-message')).toBeVisible({ timeout: 10000 })
  203 |   })
  204 | })
  205 | 
  206 | test.describe('Alerts', () => {
  207 |   test('Alerts page loads and shows severity colors', async ({ page }) => {
  208 |     await page.goto('/alerts')
  209 |     await expect(page.locator('main, .workspace-content')).toBeVisible({ timeout: 10000 })
  210 |   })
  211 | })
  212 | 
  213 | test.describe('Mobile Responsive', () => {
  214 |   test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE
  215 | 
  216 |   test('Mobile bottom navigation works', async ({ page }) => {
  217 |     await page.goto('/dashboard')
> 218 |     await expect(page.locator('aside, nav').first()).toBeVisible()
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  219 | 
  220 |     await page.goto('/water')
  221 |     await expect(page).toHaveURL(/\/water/)
  222 |   })
  223 | 
  224 |   test('Water form usable on mobile', async ({ page }) => {
  225 |     await page.goto('/water')
  226 |     const phInput = page.locator('input[name=pH]').first()
  227 |     await expect(phInput).toBeVisible({ timeout: 10000 })
  228 | 
  229 |     const box = await phInput.boundingBox()
  230 |     expect(box?.height).toBeGreaterThan(25)
  231 |   })
  232 | })
```