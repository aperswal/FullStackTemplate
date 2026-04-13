import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { spec } from './spec';
import { runSearch, runExecute, runBrowse } from './sandbox';
import { registerNavigateTool } from './navigate';
import { createLogger } from '@/lib/logger';
import type { CallerAuth } from './sandbox';

const log = createLogger('mcp');

const JSON_INDENT_SPACES = 2;

function registerSpecResources(server: McpServer): void {
  server.resource(
    'api-spec',
    'api://spec',
    {
      mimeType: 'application/json',
      description: 'Full API specification: endpoints, routes, and database schemas',
    },
    () => ({
      contents: [
        {
          uri: 'api://spec',
          text: JSON.stringify(spec, null, JSON_INDENT_SPACES),
          mimeType: 'application/json',
        },
      ],
    }),
  );

  server.resource(
    'auth-model',
    'docs://auth-model',
    { mimeType: 'text/plain', description: 'Authentication and authorization model' },
    () => ({
      contents: [
        {
          uri: 'docs://auth-model',
          text: [
            'Authentication: BetterAuth (session-based)',
            'Session cookie: better-auth.session_token',
            'Roles: free (default), pro (paid), admin (manual)',
            'Role stored on user table, synced from Stripe subscription status',
            'Protected routes: /dashboard, /settings (redirect to /login if unauthenticated)',
            'Rate limited: /api/auth/* at 10 req/min per IP',
            'OAuth providers: Google, GitHub (optional, configured via env vars)',
          ].join('\n'),
          mimeType: 'text/plain',
        },
      ],
    }),
  );
}

function registerSubscriptionTiersResource(server: McpServer): void {
  server.resource(
    'subscription-tiers',
    'docs://subscription-tiers',
    { mimeType: 'text/plain', description: 'Subscription plans and their entitlements' },
    () => ({
      contents: [
        {
          uri: 'docs://subscription-tiers',
          text: [
            'Plans:',
            '  free: Default role. Limited features.',
            '  pro: Paid via Stripe. Full feature access. Price ID configured via STRIPE_PRO_PRICE_ID.',
            '  admin: Manual assignment only. Full access + admin features.',
            '',
            'Subscription lifecycle:',
            '  checkout.session.completed -> creates subscription, syncs role',
            '  invoice.paid -> marks active, syncs role',
            '  invoice.payment_failed -> marks past_due',
            '  customer.subscription.updated -> syncs status and role',
            '  customer.subscription.deleted -> downgrades to free',
          ].join('\n'),
          mimeType: 'text/plain',
        },
      ],
    }),
  );
}

function registerErrorCodesResource(server: McpServer): void {
  server.resource(
    'error-codes',
    new ResourceTemplate('docs://error-codes', { list: undefined }),
    { mimeType: 'text/plain', description: 'Error response format and common error codes' },
    () => ({
      contents: [
        {
          uri: 'docs://error-codes',
          text: [
            'Error response format: { error: { code, message, blame, statusCode } }',
            'Blame: "client" (4xx) or "server" (5xx)',
            '',
            'Common codes:',
            '  RATE_LIMIT_EXCEEDED (429) - Too many requests',
            '  METHOD_NOT_ALLOWED (405) - Wrong HTTP method',
            '  AUTHENTICATION_REQUIRED (401) - Not logged in',
            '  FORBIDDEN (403) - Insufficient role/permissions',
            '  NOT_FOUND (404) - Resource not found',
            '  INTERNAL_SERVER_ERROR (500) - Unexpected failure',
          ].join('\n'),
          mimeType: 'text/plain',
        },
      ],
    }),
  );
}

function registerDocResources(server: McpServer): void {
  registerSubscriptionTiersResource(server);
  registerErrorCodesResource(server);
}

function registerSitemapResource(server: McpServer): void {
  server.resource(
    'sitemap',
    'app://sitemap',
    { mimeType: 'application/json', description: 'All known application routes from the sitemap' },
    () => {
      const staticRoutes = ['/', '/pricing', '/login', '/signup', '/dashboard', '/settings'];
      return {
        contents: [
          {
            uri: 'app://sitemap',
            text: JSON.stringify({ routes: staticRoutes }, null, JSON_INDENT_SPACES),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );
}

function registerResources(server: McpServer): void {
  registerSpecResources(server);
  registerDocResources(server);
  registerSitemapResource(server);
}

function registerPrompts(server: McpServer): void {
  server.prompt('debug-webhook', 'Step-by-step guide to debug a failed Stripe webhook', () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Debug a failed Stripe webhook by following these steps:',
            '1. Use the search tool to find the webhook endpoint spec',
            '2. Use the execute tool to check GET /api/health (verify app is running)',
            '3. Check the webhook_events table for recent events with status "failed"',
            '4. Look at the error_message column for the failure reason',
            '5. Common causes: missing userId in metadata, user not found, Stripe API timeout',
            '6. The webhook always returns 200 to Stripe to prevent retries — check logs for the real error',
          ].join('\n'),
        },
      },
    ],
  }));

  server.prompt(
    'investigate-user',
    'Look up a user and their subscription status',
    { email: z.string().describe('User email to investigate') },
    ({ email }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Investigate the user with email: ${email}`,
              '1. Use the execute tool to call GET /api/auth/get-session (if you have their session)',
              '2. Or use the search tool to find the user table schema',
              '3. Check the subscription table for their current subscription status',
              '4. Verify their role matches their subscription (free/pro/admin)',
              '5. If role is wrong, the syncRoleFromSubscription function may need to run',
            ].join('\n'),
          },
        },
      ],
    }),
  );
}

interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: true;
}

/**
 * Wraps an MCP tool handler with structured logging and error handling.
 * Every MCP tool MUST use this wrapper — it enforces:
 *   1. Structured log on every call (tool name + input context)
 *   2. Catch-all error handling with user-safe error messages
 *   3. Consistent response shape
 */
function withMcpTool<TInput>(
  toolName: string,
  handler: (input: TInput) => Promise<McpToolResult>,
): (input: TInput) => Promise<McpToolResult> {
  return async (input: TInput): Promise<McpToolResult> => {
    log.info({ tool: toolName }, 'MCP tool call');
    try {
      return await handler(input);
    } catch (err) {
      log.warn({ tool: toolName, err }, 'MCP tool error');
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true as const,
      };
    }
  };
}

function registerSearchTool(server: McpServer): void {
  server.tool(
    'search',
    `Search the app's API spec, page routes, and database schemas. Write a JavaScript async arrow function that receives a 'spec' object in scope with: spec.info, spec.endpoints[], spec.routes[], spec.schemas[]. Return the data you need.`,
    {
      code: z
        .string()
        .describe(
          'JavaScript async arrow function, e.g. async () => { return spec.endpoints.filter(e => e.auth) }',
        ),
    },
    withMcpTool('search', async ({ code }) => {
      const result = await runSearch(code, spec);
      return { content: [{ type: 'text' as const, text: result }] };
    }),
  );
}

function registerExecuteTool(server: McpServer, baseUrl: string, callerAuth: CallerAuth): void {
  server.tool(
    'execute',
    `Execute JavaScript code that can make HTTP requests to the running app. Write an async arrow function. A 'request' function is available: request({ method, path, body?, headers? }) returns { status, ok, headers, data }. Your auth context is forwarded automatically — the app enforces its own access control. Requests are restricted to ${baseUrl}.`,
    {
      code: z
        .string()
        .describe(
          'JavaScript async arrow function, e.g. async () => { return await request({ method: "GET", path: "/api/health" }) }',
        ),
    },
    withMcpTool('execute', async ({ code }) => {
      const { result, logs: execLogs } = await runExecute(code, baseUrl, callerAuth);
      const output =
        execLogs.length > 0 ? `${result}\n\n--- Logs ---\n${execLogs.join('\n')}` : result;
      return { content: [{ type: 'text' as const, text: output }] };
    }),
  );
}

function registerBrowseTool(server: McpServer, baseUrl: string, callerAuth: CallerAuth): void {
  server.tool(
    'browse',
    `Fetch a page from the running app and return its content as structured text. Returns title, headings, links, and main content (HTML stripped). Your auth context is forwarded — protected pages require authentication.`,
    { path: z.string().describe('URL path to browse, e.g. "/" or "/pricing"') },
    withMcpTool('browse', async ({ path }) => {
      const page = await runBrowse(path, baseUrl, callerAuth);
      const text = [
        `Title: ${page.title}`,
        '',
        `Headings:\n${page.headings.length > 0 ? page.headings.map((h) => `  - ${h}`).join('\n') : '  (none)'}`,
        '',
        `Links:\n${page.links.length > 0 ? page.links.map((l) => `  - ${l}`).join('\n') : '  (none)'}`,
        '',
        `Content:\n${page.content !== '' ? page.content : '(empty)'}`,
      ].join('\n');
      return { content: [{ type: 'text' as const, text }] };
    }),
  );
}

function registerTools(server: McpServer, baseUrl: string, callerAuth: CallerAuth): void {
  registerSearchTool(server);
  registerExecuteTool(server, baseUrl, callerAuth);
  registerBrowseTool(server, baseUrl, callerAuth);
  registerNavigateTool(server, baseUrl, callerAuth, withMcpTool);
}

export function createMcpServer(baseUrl: string, callerAuth: CallerAuth): McpServer {
  const server = new McpServer({
    name: 'fullstack-template',
    version: '1.0.0',
  });

  registerResources(server);
  registerPrompts(server);
  registerTools(server, baseUrl, callerAuth);

  return server;
}
