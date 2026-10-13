# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Maintenance mode

The frontend supports a build-time maintenance flag, `VITE_MAINTENANCE_MODE`.

When set to exactly `true` (whitespace-trimmed, case-insensitive), every route —
public, protected, or unknown, including routes entered directly in the address
bar — renders a branded UniGuide AI maintenance page and the normal application
(navigation, auth modal, protected pages) does not mount at all. Any other
value, or an absent/empty variable, keeps the normal application.

### Enabling maintenance on Vercel

1. Open the project in the Vercel dashboard → **Settings → Environment Variables**.
2. Add an environment variable named `VITE_MAINTENANCE_MODE` with the value `true`
   (production environment).
3. Redeploy the frontend. Because Vite environment variables are baked into the
   build, the flag takes effect only after a **new build/deployment** — editing
   the variable does not hot-swap a live site.
4. Traffic hits `index.html` for every path (see `vercel.json` rewrites), so a
   client refresh in maintenance mode still shows the maintenance page.

### Disabling maintenance on Vercel

1. Delete the `VITE_MAINTENANCE_MODE` variable (or set it to `false`) under
   **Settings → Environment Variables** for the production environment.
2. Redeploy the frontend. The normal application is served again after the build
   completes.

The same flow applies to any host: set `VITE_MAINTENANCE_MODE` for the build,
then run the production build again.

### Tests

- `npm test` — Vitest unit tests, including `src/lib/maintenance.test.js` (flag
  parsing) and `src/App.maintenance.test.jsx` (routing in both states).
- `npm run test:e2e` — Playwright. The normal suite runs against a dev server
  started with `.env.e2e` (`VITE_MAINTENANCE_MODE=false`); the maintenance suite
  (`e2e/maintenance.spec.js`) runs against a second dev server started with
  `.env.e2e-maintenance` (`VITE_MAINTENANCE_MODE=true`) on port 5174.

### Limitations

This is a frontend-only maintenance screen. It does not make the backend API
inaccessible to direct callers, so it should not be treated as a complete
backend maintenance or security mechanism.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
