import { defineConfig, devices } from '@playwright/test'

// Set test mode env var for the dev server
process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST = 'true'

// Pass Supabase credentials to global setup and tests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyxqtpzdkgtpjbsybsms.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eHF0cHpka2d0cGpic3lic21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjI1Njg1OSwiZXhwIjoyMTA3ODMyODU5fQ.9biq4fWlT3PoXZq2ahFvIfZpsjeMk8iwfyKMEuMclkk'
const testEmail = process.env.E2E_TEST_EMAIL || 'test-farmer@aquadairy.local'
const testPassword = process.env.E2E_TEST_PASSWORD || 'TestPass123!'

// Set in process.env so imported modules (global-setup, auth.setup) can see it
process.env.SUPABASE_SECRET_KEY = serviceRoleKey
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_PLAYWRIGHT_TEST: 'true',
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      SUPABASE_SECRET_KEY: serviceRoleKey,
    },
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100 },
  },
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
})