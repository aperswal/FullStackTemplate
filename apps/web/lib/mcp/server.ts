import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { spec } from './spec';
import { runSearch, runExecute } from './sandbox';
import { createLogger } from '@/lib/logger';
import type { CallerAuth } from './sandbox';

const log = createLogger('mcp');

interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: true;
}

/**
 * Wraps an MCP tool handler with structured logging and error handling.
 * Every MCP tool MUST use this wrapper - it enforces:
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

function registerSiteInfoResource(server: McpServer): void {
  server.resource(
    'site-info',
    'site://info',
    {
      mimeType: 'text/plain',
      description: 'Basic site information. Use the search tool to discover pages and actions.',
    },
    () => ({
      contents: [
        {
          uri: 'site://info',
          text: [
            `Name: ${spec.site.name}`,
            `Description: ${spec.site.description}`,
            '',
            'Use the search tool to discover available pages and actions.',
            'Use the execute tool with browse() to read page content or request() to call APIs.',
          ].join('\n'),
          mimeType: 'text/plain',
        },
      ],
    }),
  );
}

function registerSearchTool(server: McpServer): void {
  server.tool(
    'search',
    `Search the site's pages and available actions. Write a JavaScript async arrow function that receives a 'spec' object in scope with: spec.site (name, description, features), spec.pages[] (path, title, description, auth), spec.actions[] (name, description, auth, method, path, input). Return the data you need.`,
    {
      code: z
        .string()
        .describe(
          'JavaScript async arrow function, e.g. async () => { return spec.pages.filter(p => !p.auth) }',
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
    `Execute JavaScript code that can browse pages and make API requests. Write an async arrow function. Two helpers are available:
- browse(path) - fetch a page and return { title, headings, links, content } (HTML stripped)
- request({ method, path, body?, headers? }) - make an API call, returns { status, ok, headers, data }
Auth context is forwarded automatically when present. Requests are restricted to ${baseUrl}.`,
    {
      code: z
        .string()
        .describe(
          'JavaScript async arrow function, e.g. async () => { return await browse("/pricing") }',
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

function registerTools(server: McpServer, baseUrl: string, callerAuth: CallerAuth): void {
  registerSearchTool(server);
  registerExecuteTool(server, baseUrl, callerAuth);
}

export function createMcpServer(baseUrl: string, callerAuth: CallerAuth): McpServer {
  const server = new McpServer({
    name: 'fullstack-template',
    version: '1.0.0',
  });

  registerSiteInfoResource(server);
  registerTools(server, baseUrl, callerAuth);

  return server;
}
