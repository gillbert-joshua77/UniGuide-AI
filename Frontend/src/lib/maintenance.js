// Maintenance-mode flag for the UniGuide AI frontend.
//
// Controlled by the build-time Vite environment variable VITE_MAINTENANCE_MODE.
// It is intentionally read on every call (never cached at module load) so tests
// can override it and so a rebuild always picks up the current value.
//
//   absent / empty / "false" / anything else  -> normal application
//   "true" (trimmed, case-insensitive)        -> maintenance page
export function isMaintenanceModeEnabled(
  rawValue = import.meta.env.VITE_MAINTENANCE_MODE
) {
  return typeof rawValue === 'string' && rawValue.trim().toLowerCase() === 'true';
}
