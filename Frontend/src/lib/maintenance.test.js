import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMaintenanceModeEnabled } from './maintenance';

describe('isMaintenanceModeEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('is disabled when the flag is absent', () => {
    vi.stubEnv('VITE_MAINTENANCE_MODE', '');
    expect(isMaintenanceModeEnabled()).toBe(false);
  });

  it('is disabled for common falsey values', () => {
    expect(isMaintenanceModeEnabled(undefined)).toBe(false);
    expect(isMaintenanceModeEnabled('')).toBe(false);
    expect(isMaintenanceModeEnabled('false')).toBe(false);
    expect(isMaintenanceModeEnabled('  false  ')).toBe(false);
    expect(isMaintenanceModeEnabled('FALSE')).toBe(false);
    expect(isMaintenanceModeEnabled('0')).toBe(false);
    expect(isMaintenanceModeEnabled('1')).toBe(false);
    expect(isMaintenanceModeEnabled('yes')).toBe(false);
    expect(isMaintenanceModeEnabled('Trueish')).toBe(false);
  });

  it('is enabled only for exactly "true" after trimming and normalizing case', () => {
    expect(isMaintenanceModeEnabled('true')).toBe(true);
    expect(isMaintenanceModeEnabled(' TRUE ')).toBe(true);
    expect(isMaintenanceModeEnabled('TrUe')).toBe(true);
    expect(isMaintenanceModeEnabled('\ttrue\n')).toBe(true);
  });

  it('rejects non-string values (no secret/query bypass via truthiness)', () => {
    expect(isMaintenanceModeEnabled(true)).toBe(false);
    expect(isMaintenanceModeEnabled(false)).toBe(false);
    expect(isMaintenanceModeEnabled(null)).toBe(false);
    expect(isMaintenanceModeEnabled(1)).toBe(false);
  });

  it('reads the value from import.meta.env when no argument is passed', () => {
    vi.stubEnv('VITE_MAINTENANCE_MODE', 'true');
    expect(isMaintenanceModeEnabled()).toBe(true);

    vi.stubEnv('VITE_MAINTENANCE_MODE', 'false');
    expect(isMaintenanceModeEnabled()).toBe(false);
  });
});