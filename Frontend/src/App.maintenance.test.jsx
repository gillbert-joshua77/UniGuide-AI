// @vitest-environment jsdom
//
// Self-contained maintenance-mode regression suite. Declares the jsdom
// environment inline so it runs from a clean checkout without any committed
// vitest config (Vitest falls back to the repo's vite.config.js for JSX).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// WebGL is not available in jsdom; replace the 3D hero visual with a stub.
vi.mock('./Components/three/GuidanceCore', () => ({
  default: () => null,
}));

const ROUTES = [
  '/',
  '/about',
  '/login',
  '/profile',
  '/settings',
  '/guidance',
  '/totally/unknown/page',
];

let container;
let root;

function renderApp() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<App />);
  });
}

function unmountApp() {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
  window.history.pushState({}, '', '/');
}

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // framer-motion uses both APIs for `whileInView`; jsdom lacks them.
  class ObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', ObserverStub);
  vi.stubGlobal('ResizeObserver', ObserverStub);
});

afterEach(() => {
  if (root) unmountApp();
  vi.unstubAllEnvs();
});

describe('maintenance mode enabled', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MAINTENANCE_MODE', 'true');
  });

  it.each(ROUTES)('renders the maintenance page for every route: %s', (route) => {
    window.history.pushState({}, '', route);
    renderApp();

    const title = container.querySelector('.ug-maintenance-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toMatch(/We.ll be back soon/i);
    expect(container.querySelector('.ug-maintenance-brand-name')).not.toBeNull();

    expect(container.querySelector('.navbar-wrapper')).toBeNull();
    expect(container.textContent).not.toContain('Members only');
  });

  it.each(['/profile', '/guidance', '/opportunities'])(
    'keeps protected routes (%s) from rendering normal content',
    (route) => {
      window.history.pushState({}, '', route);
      renderApp();

      expect(container.textContent).not.toContain('Members only');
      expect(container.querySelector('.ug-maintenance-title')).not.toBeNull();
    }
  );

  it('sets maintenance page metadata', () => {
    window.history.pushState({}, '', '/');
    renderApp();
    expect(document.title).toBe('UniGuide AI — Scheduled Maintenance');
  });
});

describe('maintenance mode disabled', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MAINTENANCE_MODE', 'false');
  });

  it('renders the normal landing page instead of maintenance', () => {
    window.history.pushState({}, '', '/');
    renderApp();

    expect(container.querySelector('.ug-maintenance-title')).toBeNull();
    expect(container.textContent).toContain('better guided');
    expect(container.querySelector('.navbar-wrapper')).not.toBeNull();
    expect(document.title).not.toMatch(/Scheduled Maintenance/i);
  });

  it('renders the normal about page instead of maintenance', () => {
    window.history.pushState({}, '', '/about');
    renderApp();

    expect(container.querySelector('.ug-maintenance-title')).toBeNull();
    expect(container.textContent).toContain('Guiding the next generation');
  });
});