import { type NextRequest, NextResponse } from 'next/server';
import type { ErrorResponseBody } from '@template/shared';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { ROUTES } from '@/lib/routes';

const protectedPaths = [ROUTES.dashboard, ROUTES.settings];
const authPaths = [ROUTES.login, ROUTES.signup];

const MS_PER_SECOND = 1000;
const CLEANUP_INTERVAL_MS = 60_000;
const HSTS_MAX_AGE_SECONDS = 31536000;

// Inline in-memory rate limiter for auth endpoints.
// We don't use lib/rate-limit here because:
// 1. Middleware runs on the Edge Runtime where the env module may not be available
// 2. The lib version supports async Upstash calls, but middleware rate checks must be synchronous
// 3. This is intentionally simple: 10 req/min per IP for auth endpoints only
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW = 60;
const MAX_RATE_STORE_SIZE = 10_000;
const authRateStore = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Math.floor(Date.now() / MS_PER_SECOND);
  const entry = authRateStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    if (authRateStore.size >= MAX_RATE_STORE_SIZE) {
      for (const [key, val] of authRateStore) {
        if (val.resetAt <= now) {
          authRateStore.delete(key);
        }
      }
      if (authRateStore.size >= MAX_RATE_STORE_SIZE) {
        return { allowed: true, retryAfter: 0 };
      }
    }
    authRateStore.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > AUTH_RATE_LIMIT) {
    return { allowed: false, retryAfter: entry.resetAt - now };
  }
  return { allowed: true, retryAfter: 0 };
}

// Periodic cleanup of expired entries
if (typeof globalThis !== 'undefined') {
  const cleanup = setInterval(() => {
    const now = Math.floor(Date.now() / MS_PER_SECOND);
    for (const [key, entry] of authRateStore) {
      if (entry.resetAt <= now) {
        authRateStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanup === 'object' && 'unref' in cleanup) {
    cleanup.unref();
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Rate limit auth API endpoints
  if (pathname.startsWith('/api/auth')) {
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkAuthRateLimit(ip);
    if (!allowed) {
      const body: ErrorResponseBody = {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication requests. Please try again later.',
          blame: 'client',
          statusCode: 429,
        },
      };
      return NextResponse.json(body, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      });
    }
    // Let the auth handler proceed
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE);
  const isAuthenticated = Boolean(sessionCookie);

  // Redirect unauthenticated users away from protected routes
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL(ROUTES.login, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }
  }

  const response = NextResponse.next();
  setSecurityHeaders(response);

  return response;
}

function setSecurityHeaders(response: NextResponse): void {
  const isDev = process.env.NODE_ENV !== 'production';
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`;

  response.headers.set('x-nonce', nonce);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://*.posthog.com; frame-ancestors 'none';`,
  );

  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`,
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
