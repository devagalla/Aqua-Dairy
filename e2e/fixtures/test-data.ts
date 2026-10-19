// Test user credentials - configure via environment variables for CI
export const TEST_USERS = {
  primary: {
    email: process.env.E2E_TEST_EMAIL || 'test-farmer@aquadairy.local',
    password: process.env.E2E_TEST_PASSWORD || 'TestPass123!',
  },
  secondary: {
    email: process.env.E2E_TEST_EMAIL_2 || 'test-farmer-2@aquadairy.local',
    password: process.env.E2E_TEST_PASSWORD_2 || 'TestPass123!',
  },
}

export const TEST_FARM = {
  name: 'E2E Test Farm',
  locality: 'Bhimavaram',
  district: 'West Godavari',
  state: 'Andhra Pradesh',
}

export const TEST_POND = {
  name: 'Test Pond 1',
  area_ha: 1.5,
  depth_m: 1.2,
  locality: 'Bhimavaram',
  latitude: 16.5449,
  longitude: 81.5212,
}

export const TEST_CYCLE = {
  species: 'Litopenaeus vannamei',
  stocking_density: 60,
  target_harvest_days: 120,
}