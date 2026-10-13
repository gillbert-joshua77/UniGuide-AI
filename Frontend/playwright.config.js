import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

// Maintenance-mode server runs on its own port with its own mode/env so the
// same `npm run test:e2e` run can cover BOTH flag values with a single command.
const MAINTENANCE_PORT = 5174
const MAINTENANCE_URL = `http://localhost:${MAINTENANCE_PORT}`

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // Regular application: maintenance disabled (`.env.e2e`).
      name: 'chromium',
      testIgnore: '**/maintenance.spec.js',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Maintenance page: `VITE_MAINTENANCE_MODE=true` (`.env.e2e-maintenance`).
      name: 'chromium-maintenance',
      testMatch: '**/maintenance.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: MAINTENANCE_URL,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --mode e2e --port ${PORT} --strictPort`,
      url: `${BASE_URL}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --mode e2e-maintenance --port ${MAINTENANCE_PORT} --strictPort`,
      url: `${MAINTENANCE_URL}/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})