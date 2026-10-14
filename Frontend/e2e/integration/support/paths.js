import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// here = <repo>/Frontend/e2e/integration/support
export const FRONTEND_DIR = path.resolve(here, '..', '..', '..')
export const REPO_ROOT = path.resolve(FRONTEND_DIR, '..')
export const BACKEND_DIR = path.join(REPO_ROOT, 'Backend')
export const VENV_PYTHON = path.join(REPO_ROOT, '.venv', 'Scripts', 'python.exe')

export const DJANGO_SETTINGS = 'config.settings_e2e'

export const BACKEND_HOST = '127.0.0.1'
export const BACKEND_PORT = 8000
export const FRONTEND_PORT = 5175

// Shared between the Django server (EMAIL_FILE_PATH) and the tests.
export const MAIL_DIR =
  process.env.E2E_MAIL_DIR ||
  path.join(os.tmpdir(), 'uniguide-e2e-mailbox')
