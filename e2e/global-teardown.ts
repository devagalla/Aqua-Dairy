// Global teardown for Playwright E2E tests
// This runs once after all tests

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown: Cleaning up after E2E tests...')

  // Can be used for:
  // - Cleaning up test data from Supabase
  // - Closing connections
  // - Generating test reports

  console.log('✅ Global teardown complete')
}

export default globalTeardown