import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createMcpServer } from '@/lib/mcp/server';
import type { CallerAuth } from '@/lib/mcp/sandbox';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const log = createLogger('mcp');
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function isAuthorized(request: Request): boolean {
  const mcpApiKey = process.env.MCP_API_KEY;
  if (!mcpApiKey) return true;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === mcpApiKey;
}

function extractCallerAuth(request: Request): CallerAuth {
  return {
    cookies: request.headers.get('cookie') ?? undefined,
    authorization: request.headers.get('x-forwarded-authorization') ?? undefined,
  };
}

function jsonError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message },
      id: null,
    }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

async function handleMcpRequest(request: Request, enableJsonResponse = false): Promise<Response> {
  if (!isAuthorized(request)) {
    return jsonError(401, 'Unauthorized: missing or invalid MCP_API_KEY');
  }

  try {
    const callerAuth = extractCallerAuth(request);
    const server = createMcpServer(BASE_URL, callerAuth);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse,
    });

    await server.connect(transport);
    return transport.handleRequest(request);
  } catch (err) {
    log.error({ err }, 'MCP request failed');
    return jsonError(500, 'Internal server error');
  }
}

export async function POST(request: Request) {
  return handleMcpRequest(request, true);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
