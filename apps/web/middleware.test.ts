import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/constants', () => ({
  AUTH_SESSION_COOKIE: 'better-auth.session_token',
}));

vi.mock('@/lib/routes', () => ({
  ROUTES: {
    dashboard: '/dashboard',
    settings: '/settings',
    login: '/login',
    signup: '/signup',
  },
}));

import { middleware } from './middleware';

function createRequest(
  pathname: string,
  options?: { cookie?: string; ip?: string; realIp?: string },
) {
  const url = `http://localhost:3000${pathname}`;
  const headers: Record<string, string> = {};
  if (options?.ip) {
    headers['x-forwarded-for'] = options.ip;
  }
  if (options?.realIp) {
    headers['x-real-ip'] = options.realIp;
  }

  const req = new NextRequest(url, {
    method: 'GET',
    headers,
  });
  if (options?.cookie) {
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) =>
          name === 'better-auth.session_token' ? { value: options.cookie } : undefined,
      },
    });
  }
  return req;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('auth redirects', () => {
    it('redirects unauthenticated users from /dashboard to /login', () => {
      const response = middleware(createRequest('/dashboard'));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('redirects unauthenticated users from /settings to /login', () => {
      const response = middleware(createRequest('/settings'));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('includes callbackUrl in redirect', () => {
      const response = middleware(createRequest('/dashboard'));
      expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard');
    });

    it('redirects authenticated users from /login to /dashboard', () => {
      const response = middleware(createRequest('/login', { cookie: 'session-token' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('redirects authenticated users from /signup to /dashboard', () => {
      const response = middleware(createRequest('/signup', { cookie: 'session-token' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('allows authenticated users to access /dashboard', () => {
      const response = middleware(createRequest('/dashboard', { cookie: 'session-token' }));
      expect(response.status).toBe(200);
    });

    it('allows unauthenticated users to access public routes', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.status).toBe(200);
    });

    it('redirects unauthenticated users from nested protected paths', () => {
      const response = middleware(createRequest('/settings/profile'));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('security headers', () => {
    it('sets X-Frame-Options on non-API routes', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('sets X-Content-Type-Options', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('sets Referrer-Policy', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('sets Content-Security-Policy', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('sets Permissions-Policy', () => {
      const response = middleware(createRequest('/pricing'));
      expect(response.headers.get('Permissions-Policy')).toBe(
        'camera=(), microphone=(), geolocation=()',
      );
    });
  });

  describe('auth API rate limiting', () => {
    it('allows requests within the limit', () => {
      const response = middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-1' }));
      expect(response.status).toBe(200);
    });

    it('blocks requests exceeding 10 per minute', () => {
      for (let i = 0; i < 10; i++) {
        middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-2' }));
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-2' }));
      expect(blocked.status).toBe(429);
    });

    it('returns Retry-After header when rate limited', () => {
      for (let i = 0; i < 10; i++) {
        middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-3' }));
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-3' }));
      expect(blocked.headers.get('Retry-After')).toBeDefined();
    });

    it('returns proper error body when rate limited', async () => {
      for (let i = 0; i < 10; i++) {
        middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-4' }));
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-4' }));
      const body = await blocked.json();
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error.statusCode).toBe(429);
      expect(body.error.blame).toBe('client');
    });

    it('evicts expired entries when store reaches max size', () => {
      vi.useFakeTimers();

      // Fill the store with unique IPs to reach MAX_RATE_STORE_SIZE (10000)
      for (let i = 0; i < 10_001; i++) {
        middleware(createRequest('/api/auth/sign-in', { ip: `evict-ip-${i}` }));
      }
      vi.advanceTimersByTime(61_000);

      const freshIp = 'evict-fresh';
      for (let i = 0; i < 10; i++) {
        expect(middleware(createRequest('/api/auth/sign-in', { ip: freshIp })).status).toBe(200);
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { ip: freshIp }));
      expect(blocked.status).toBe(429);

      vi.useRealTimers();
    });

    it('tracks different IPs independently', () => {
      for (let i = 0; i < 10; i++) {
        middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-5a' }));
      }

      const differentIp = middleware(createRequest('/api/auth/sign-in', { ip: 'rl-test-5b' }));
      expect(differentIp.status).toBe(200);
    });
  });

  describe('client IP extraction', () => {
    it('uses x-forwarded-for header', () => {
      const ip = 'ip-fwd-test';
      for (let i = 0; i < 10; i++) {
        expect(middleware(createRequest('/api/auth/sign-in', { ip })).status).toBe(200);
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { ip }));
      expect(blocked.status).toBe(429);
    });

    it('uses x-real-ip as fallback', () => {
      const realIp = 'ip-real-test';
      for (let i = 0; i < 10; i++) {
        expect(middleware(createRequest('/api/auth/sign-in', { realIp })).status).toBe(200);
      }

      const blocked = middleware(createRequest('/api/auth/sign-in', { realIp }));
      expect(blocked.status).toBe(429);
    });

    it('uses "unknown" when no IP headers present', () => {
      for (let i = 0; i < 10; i++) {
        expect(middleware(createRequest('/api/auth/sign-in')).status).toBe(200);
      }

      const blocked = middleware(createRequest('/api/auth/sign-in'));
      expect(blocked.status).toBe(429);
    });

    it('uses first IP from comma-separated x-forwarded-for', () => {
      const url = 'http://localhost:3000/api/auth/sign-in';
      const firstIp = 'first-ip-unique';

      for (let i = 0; i < 10; i++) {
        const req = new NextRequest(url, {
          method: 'GET',
          headers: { 'x-forwarded-for': `${firstIp}, second-ip-${i}` },
        });
        expect(middleware(req).status).toBe(200);
      }

      const blockedReq = new NextRequest(url, {
        method: 'GET',
        headers: { 'x-forwarded-for': `${firstIp}, another-ip` },
      });
      expect(middleware(blockedReq).status).toBe(429);
    });
  });

  describe('CSP unsafe-eval', () => {
    it('includes unsafe-eval in development CSP', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const response = middleware(createRequest('/'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain('unsafe-eval');

      vi.unstubAllEnvs();
    });

    it('excludes unsafe-eval in production CSP', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const response = middleware(createRequest('/'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).not.toContain('unsafe-eval');

      vi.unstubAllEnvs();
    });

    it('uses self and unsafe-inline in production CSP without strict-dynamic', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const response = middleware(createRequest('/'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("'self'");
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).not.toContain('strict-dynamic');

      vi.unstubAllEnvs();
    });
  });

  describe('HSTS in production', () => {
    it('sets Strict-Transport-Security when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const response = middleware(createRequest('/'));
      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload',
      );

      vi.unstubAllEnvs();
    });

    it('does not set HSTS in development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const response = middleware(createRequest('/about'));
      expect(response.headers.get('Strict-Transport-Security')).toBeNull();

      vi.unstubAllEnvs();
    });
  });
});
