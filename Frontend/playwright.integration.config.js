import { defineConfig, devices } from '@playwright/test'

import {
  BACKEND_DIR,
  BACKEND_HOST,
  BACKEND_PORT,
  DJANGO_SETTINGS,
  FRONTEND_PORT,
  MAIL_DIR,
  VENV_PYTHON,
} from './e2e/integration/support/paths.js'

const BASE_URL = `http://127.0.0.1:${FRONTEND_PORT}`
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`

// Phase 4A: real frontend (Vite dev server) against the real local Django
// API. Application API requests are NOT intercepted. External services are
// stubbed server-side (see Backend/e2e/stubs.py) and blocked client-side.
export default defineConfig({
  testDir: './e2e/integration',
  testMatch: '**/*.int.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  globalSetup: './e2e/integration/support/global-setup.js',
  use: {
    baseURL: BASE_URL,
    headless: true,
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'integration-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `"${VENV_PYTHON}" manage.py runserver ${BACKEND_HOST}:${BACKEND_PORT} --noreload`,
      cwd: BACKEND_DIR,
      url: `${BACKEND_URL}/health/`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DJANGO_SETTINGS_MODULE: DJANGO_SETTINGS,
        E2E_MAIL_DIR: MAIL_DIR,
        PYTHONUTF8: '1',
      },
    },
    {
      command: `npm run dev -- --mode e2e-real --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      url: `${BASE_URL}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
