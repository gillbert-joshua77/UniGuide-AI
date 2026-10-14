import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import {
  BACKEND_DIR,
  DJANGO_SETTINGS,
  MAIL_DIR,
  VENV_PYTHON,
} from './paths.js'

function runManage(args) {
  execFileSync(VENV_PYTHON, ['manage.py', ...args], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      DJANGO_SETTINGS_MODULE: DJANGO_SETTINGS,
      E2E_MAIL_DIR: MAIL_DIR,
      PYTHONUTF8: '1',
    },
  })
}

// Runs once before the integration suite. Every DB-touching command is
// guarded by `e2e_preflight`, so nothing can reach the development database.
export default async function globalSetup() {
  fs.rmSync(MAIL_DIR, { recursive: true, force: true })
  fs.mkdirSync(MAIL_DIR, { recursive: true })

  runManage(['e2e_preflight'])
  runManage(['e2e_setup_db'])
  runManage(['e2e_reset'])
}
