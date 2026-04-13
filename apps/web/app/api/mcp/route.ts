import { timingSafeEqual } from 'node:crypto';

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createMcpServer } from '@/lib/mcp/server';
import type { CallerAuth } from '@/lib/mcp/sandbox';
import { env } from '@/lib/env';
import { createRequestLogger } from '@/lib/logger';
import { createRateLimiter, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MS_PER_SECOND = 1000;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const JSON_RPC_SERVER_ERROR = -32000;
const SESSION_TTL_MINUTES = 30;
const SECONDS_PER_MINUTE = 60;
const SESSION_TTL_MS = SESSION_TTL_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

interface McpSession {
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
  createdAt: number;
}

const sessions = new Map<string, McpSession>();

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      session.transport.close().catch(() => {});
      sessions.delete(id);
    }
  }
}

function isAuthorized(request: Request): boolean {
  const mcpApiKey = env.MCP_API_KEY;

  if (mcpApiKey === undefined || mcpApiKey === '') {
    return env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === null || authHeader === '') {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  const tokenBuffer = Buffer.from(token);
  const keyBuffer = Buffer.from(mcpApiKey);

  if (tokenBuffer.length !== keyBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, keyBuffer);
}

function extractCallerAuth(request: Request): CallerAuth {
  return {
    cookies: request.headers.get('cookie') ?? undefined,
    authorization: request.headers.get('x-forwarded-authorization') ?? undefined,
  };
}

function jsonError(status: number, message: string, requestId: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: JSON_RPC_SERVER_ERROR, message },
      id: null,
    }),
    { status, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } },
  );
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

async function applyRateLimit(request: Request, requestId: string): Promise<Response | null> {
  const { logger: log } = createRequestLogger(requestId);
  try {
    const limiter = await createRateLimiter(RATE_LIMITS.mcp);
    const result = await limiter.check(getClientIp(request));
    if (!result.success) {
      const retryAfter = Math.max(0, result.reset - Math.floor(Date.now() / MS_PER_SECOND));
      log.warn({ limit: result.limit }, 'MCP rate limit exceeded');
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: JSON_RPC_SERVER_ERROR, message: 'Rate limit exceeded' },
          id: null,
        }),
        {
          status: HTTP_TOO_MANY_REQUESTS,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'x-request-id': requestId,
          },
        },
      );
    }
  } catch (err) {
    log.error({ err }, 'Rate limiter error, allowing request through');
  }
  return null;
}

const HTTP_NOT_FOUND = 404;

async function routeExistingSession(
  sessionId: string,
  request: Request,
  requestId: string,
): Promise<Response> {
  const session = sessions.get(sessionId);
  if (session !== undefined) {
    const response = await session.transport.handleRequest(request);
    return (
      response ?? jsonError(HTTP_NOT_FOUND, 'Session transport returned no response', requestId)
    );
  }
  return jsonError(HTTP_NOT_FOUND, 'Session not found', requestId);
}

async function createNewSession(
  request: Request,
  log: ReturnType<typeof createRequestLogger>['logger'],
): Promise<Response> {
  const callerAuth = extractCallerAuth(request);
  const server = createMcpServer(BASE_URL, callerAuth);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    enableJsonResponse: request.method === 'POST',
  });

  await server.connect(transport);
  const response = await transport.handleRequest(request);

  const newSessionId = transport.sessionId;
  if (newSessionId !== undefined && newSessionId !== '' && !sessions.has(newSessionId)) {
    sessions.set(newSessionId, { server, transport, createdAt: Date.now() });

    transport.onclose = () => {
      sessions.delete(newSessionId);
    };

    log.info({ method: request.method, sessionId: newSessionId }, 'MCP session started');
  }

  return response;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { logger: log } = createRequestLogger(requestId);

  const rateLimitResponse = await applyRateLimit(request, requestId);
  if (rateLimitResponse !== null) {
    return rateLimitResponse;
  }

  if (!isAuthorized(request)) {
    return jsonError(HTTP_UNAUTHORIZED, 'Unauthorized: missing or invalid MCP_API_KEY', requestId);
  }

  try {
    cleanupStaleSessions();

    const sessionId = request.headers.get('mcp-session-id');

    if (sessionId !== null && sessionId !== '') {
      return await routeExistingSession(sessionId, request, requestId);
    }

    return await createNewSession(request, log);
  } catch (err) {
    log.error({ err }, 'MCP request failed');
    return jsonError(HTTP_INTERNAL_SERVER_ERROR, 'Internal server error', requestId);
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export async function GET(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}
