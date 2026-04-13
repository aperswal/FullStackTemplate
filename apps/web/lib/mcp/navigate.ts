import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { runBrowse } from './sandbox';
import type { CallerAuth } from './sandbox';

const DEFAULT_NAV_DEPTH = 2;
const MAX_NAV_PAGES = 20;
const CONTENT_PREVIEW_LENGTH = 200;
const JSON_INDENT_SPACES = 2;

interface NavEntry {
  title: string;
  links: string[];
  contentPreview: string;
}
interface NavQueueItem {
  path: string;
  currentDepth: number;
}

export function extractInternalHrefs(links: string[]): string[] {
  return links
    .map((link) => link.split(' → ').at(1))
    .filter((href): href is string => href?.startsWith('/') === true);
}

async function crawlPages(
  startPath: string,
  maxDepth: number,
  baseUrl: string,
  callerAuth: CallerAuth,
): Promise<Map<string, NavEntry>> {
  const visited = new Map<string, NavEntry>();
  const queue: NavQueueItem[] = [{ path: startPath, currentDepth: 0 }];

  while (queue.length > 0 && visited.size < MAX_NAV_PAGES) {
    const item = queue.shift();
    /* v8 ignore next 3 -- defensive guard: while condition guarantees queue is non-empty */
    if (item === undefined) {
      break;
    }
    if (visited.has(item.path)) {
      continue;
    }

    const page = await runBrowse(item.path, baseUrl, callerAuth);
    visited.set(item.path, {
      title: page.title,
      links: page.links,
      contentPreview: page.content.slice(0, CONTENT_PREVIEW_LENGTH),
    });

    if (item.currentDepth < maxDepth) {
      for (const href of extractInternalHrefs(page.links)) {
        if (!visited.has(href)) {
          queue.push({ path: href, currentDepth: item.currentDepth + 1 });
        }
      }
    }
  }

  return visited;
}

interface McpToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: true;
}

type ToolWrapper = <TInput>(
  name: string,
  handler: (input: TInput) => Promise<McpToolResult>,
) => (input: TInput) => Promise<McpToolResult>;

export function registerNavigateTool(
  server: McpServer,
  baseUrl: string,
  callerAuth: CallerAuth,
  withMcpTool: ToolWrapper,
): void {
  server.tool(
    'navigate',
    'Discover all reachable pages starting from a URL by following internal links. Returns a map of discovered pages with their titles, links, and content previews.',
    {
      startPath: z.string().describe('Starting URL path, e.g. "/" or "/pricing"'),
      maxDepth: z.number().optional().describe('Maximum link depth to follow (default 2)'),
    },
    withMcpTool('navigate', async ({ startPath, maxDepth }) => {
      const visited = await crawlPages(
        startPath,
        maxDepth ?? DEFAULT_NAV_DEPTH,
        baseUrl,
        callerAuth,
      );
      const result = Object.fromEntries(visited);
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT_SPACES) },
        ],
      };
    }),
  );
}
