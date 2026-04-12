import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { spec } from './spec';
import { runSearch, runExecute, runBrowse } from './sandbox';
import type { CallerAuth } from './sandbox';

export function createMcpServer(baseUrl: string, callerAuth: CallerAuth): McpServer {
  const server = new McpServer({
    name: 'fullstack-template',
    version: '1.0.0',
  });

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
    async ({ code }) => {
      try {
        const result = await runSearch(code, spec);
        return { content: [{ type: 'text' as const, text: result }] };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

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
    async ({ code }) => {
      try {
        const { result, logs } = await runExecute(code, baseUrl, callerAuth);
        const output = logs.length > 0 ? `${result}\n\n--- Logs ---\n${logs.join('\n')}` : result;
        return { content: [{ type: 'text' as const, text: output }] };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'browse',
    `Fetch a page from the running app and return its content as structured text. Returns title, headings, links, and main content (HTML stripped). Your auth context is forwarded — protected pages require authentication.`,
    { path: z.string().describe('URL path to browse, e.g. "/" or "/pricing"') },
    async ({ path }) => {
      try {
        const page = await runBrowse(path, baseUrl, callerAuth);
        const text = [
          `Title: ${page.title}`,
          '',
          `Headings:\n${page.headings.map((h) => `  - ${h}`).join('\n') || '  (none)'}`,
          '',
          `Links:\n${page.links.map((l) => `  - ${l}`).join('\n') || '  (none)'}`,
          '',
          `Content:\n${page.content || '(empty)'}`,
        ].join('\n');
        return { content: [{ type: 'text' as const, text }] };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
