import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth/server';
import { createErrorResponse, ClientError, ServerError } from '@/lib/errors';
import { createRequestLogger, withCorrelation } from '@/lib/logger';
import { createRateLimiter, RATE_LIMITS } from '@/lib/rate-limit';
import type { RateLimitConfig, RateLimitTier } from '@/lib/rate-limit';

const MS_PER_SECOND = 1000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRouteOptions {
  /** Authentication requirement for this route */
  auth: 'required' | 'optional' | 'none';
  /** Rate limiting tier or custom config — every route must declare its limit */
  rateLimit: RateLimitTier | RateLimitConfig;
  /** Allowed HTTP methods — every route must declare what it accepts */
  methods: HttpMethod[];
}

interface ApiContext {
  /** Authenticated user session (present when auth is 'required', may be present when 'optional') */
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  /** Request-scoped logger with correlation ID */
  log: ReturnType<typeof createRequestLogger>['logger'];
  /** Correlation ID for this request */
  requestId: string;
}

type ApiHandler = (request: NextRequest, context: ApiContext) => Response | Promise<Response>;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkMethod(
  request: NextRequest,
  allowedMethods: HttpMethod[],
  requestId: string,
): Response | null {
  if (allowedMethods.includes(request.method as HttpMethod)) {
    return null;
  }
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${request.method} is not allowed.`,
        blame: 'client' as const,
        statusCode: 405,
      },
    },
    { status: 405, headers: { Allow: allowedMethods.join(', '), 'x-request-id': requestId } },
  );
}

async function checkRateLimit(
  request: NextRequest,
  options: ApiRouteOptions,
  log: ApiContext['log'],
  requestId: string,
): Promise<Response | null> {
  const config =
    typeof options.rateLimit === 'string' ? RATE_LIMITS[options.rateLimit] : options.rateLimit;
  try {
    const limiter = await createRateLimiter(config);
    const identifier = getClientIp(request);
    const result = await limiter.check(identifier);

    if (!result.success) {
      const retryAfter = Math.max(0, result.reset - Math.floor(Date.now() / MS_PER_SECOND));
      log.warn({ identifier, limit: result.limit }, 'Rate limit exceeded');
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            blame: 'client' as const,
            statusCode: 429,
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter), 'x-request-id': requestId },
        },
      );
    }
  } catch (err) {
    log.error({ err }, 'Rate limiter error, allowing request through');
  }
  return null;
}

async function authenticateRequest(
  request: NextRequest,
  options: ApiRouteOptions,
  log: ApiContext['log'],
  requestId: string,
): Promise<{ session: ApiContext['session'] } | Response> {
  if (options.auth === 'none') {
    return { session: null };
  }

  let session: ApiContext['session'] = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    log.error({ err }, 'Session retrieval failed');
  }

  if (options.auth === 'required' && !session) {
    const response = createErrorResponse(
      new ClientError('Authentication required', {
        statusCode: 401,
        userMessage: 'You must be logged in to access this resource.',
      }),
    );
    response.headers.set('x-request-id', requestId);
    return response;
  }

  return { session };
}

export function withApiRoute(options: ApiRouteOptions, handler: ApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    const { logger: log } = createRequestLogger(requestId);

    return withCorrelation(requestId, async () => {
      const methodError = checkMethod(request, options.methods, requestId);
      if (methodError) {
        return methodError;
      }

      const rateLimitError = await checkRateLimit(request, options, log, requestId);
      if (rateLimitError) {
        return rateLimitError;
      }

      const authResult = await authenticateRequest(request, options, log, requestId);
      if (authResult instanceof Response) {
        return authResult;
      }

      try {
        const response = await handler(request, { session: authResult.session, log, requestId });
        response.headers.set('x-request-id', requestId);
        return response;
      } catch (err) {
        const response = createErrorResponse(
          err instanceof ClientError || err instanceof ServerError
            ? err
            : new ServerError('Internal server error'),
        );
        if (!(err instanceof ClientError)) {
          log.error({ err, method: request.method, url: request.url }, 'Unhandled route error');
        }
        response.headers.set('x-request-id', requestId);
        return response;
      }
    });
  };
}
