import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createMcpServer } from './server';
import type { CallerAuth } from './sandbox';

// Mock the sandbox functions so we can test server tool wiring without real execution
vi.mock('./sandbox', () => ({
  runSearch: vi.fn(),
  runExecute: vi.fn(),
  runBrowse: vi.fn(),
}));

import { runSearch, runExecute, runBrowse } from './sandbox';

describe('createMcpServer', () => {
  const baseUrl = 'http://localhost:3000';
  const callerAuth: CallerAuth = { cookies: 'session=abc', authorization: 'Bearer tok' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a server with expected name and version', () => {
    const server = createMcpServer(baseUrl, callerAuth);
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  it('accepts empty auth context without errors', () => {
    const server = createMcpServer(baseUrl, {});
    expect(server).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Resources
  // ---------------------------------------------------------------------------

  describe('resources', () => {
    it('registers api-spec resource with JSON content', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      const specResource = resources?.['api://spec'];
      expect(specResource).toBeDefined();

      const result = specResource.readCallback(new URL('api://spec'));
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('api://spec');
      expect(result.contents[0].mimeType).toBe('application/json');

      const parsed = JSON.parse(result.contents[0].text);
      expect(parsed.info).toBeDefined();
      expect(parsed.endpoints).toBeDefined();
    });

    it('registers auth-model resource with auth documentation', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      const authResource = resources?.['docs://auth-model'];
      expect(authResource).toBeDefined();

      const result = authResource.readCallback(new URL('docs://auth-model'));
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('docs://auth-model');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toContain('BetterAuth');
      expect(result.contents[0].text).toContain('session_token');
    });

    it('registers subscription-tiers resource with plan details', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      const tiersResource = resources?.['docs://subscription-tiers'];
      expect(tiersResource).toBeDefined();

      const result = tiersResource.readCallback(new URL('docs://subscription-tiers'));
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('docs://subscription-tiers');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toContain('Plans:');
      expect(result.contents[0].text).toContain('free');
      expect(result.contents[0].text).toContain('pro');
      expect(result.contents[0].text).toContain('admin');
      expect(result.contents[0].text).toContain('checkout.session.completed');
      expect(result.contents[0].text).toContain('STRIPE_PRO_PRICE_ID');
    });

    it('registers error-codes resource template with error documentation', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const templates = (server as any)._registeredResourceTemplates;
      const errorCodesTemplate = templates?.['error-codes'];
      expect(errorCodesTemplate).toBeDefined();

      const result = errorCodesTemplate.readCallback(new URL('docs://error-codes'), {});
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('docs://error-codes');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toContain('RATE_LIMIT_EXCEEDED');
      expect(result.contents[0].text).toContain('AUTHENTICATION_REQUIRED');
      expect(result.contents[0].text).toContain('FORBIDDEN');
      expect(result.contents[0].text).toContain('NOT_FOUND');
      expect(result.contents[0].text).toContain('INTERNAL_SERVER_ERROR');
      expect(result.contents[0].text).toContain('client');
      expect(result.contents[0].text).toContain('server');
    });

    it('registers sitemap resource with static routes', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      const sitemapResource = resources?.['app://sitemap'];
      expect(sitemapResource).toBeDefined();

      const result = sitemapResource.readCallback(new URL('app://sitemap'));
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('app://sitemap');
      expect(result.contents[0].mimeType).toBe('application/json');

      const parsed = JSON.parse(result.contents[0].text);
      expect(parsed.routes).toEqual(
        expect.arrayContaining(['/', '/pricing', '/login', '/signup', '/dashboard', '/settings']),
      );
      expect(parsed.routes).toHaveLength(6);
    });
  });

  // ---------------------------------------------------------------------------
  // Prompts
  // ---------------------------------------------------------------------------

  describe('prompts', () => {
    it('registers debug-webhook prompt with step-by-step guide', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const prompts = (server as any)._registeredPrompts;
      const debugWebhook = prompts?.['debug-webhook'];
      expect(debugWebhook).toBeDefined();

      const result = debugWebhook.callback({});
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('Debug a failed Stripe webhook');
      expect(result.messages[0].content.text).toContain('webhook_events');
      expect(result.messages[0].content.text).toContain('/api/health');
    });

    it('registers investigate-user prompt with email interpolation', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const prompts = (server as any)._registeredPrompts;
      const investigateUser = prompts?.['investigate-user'];
      expect(investigateUser).toBeDefined();

      const result = investigateUser.callback({ email: 'test@example.com' });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('test@example.com');
      expect(result.messages[0].content.text).toContain('subscription');
      expect(result.messages[0].content.text).toContain('syncRoleFromSubscription');
    });
  });

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------

  describe('search tool', () => {
    it('calls runSearch and returns result on success', async () => {
      vi.mocked(runSearch).mockResolvedValue('["/api/health"]');

      const server = createMcpServer(baseUrl, callerAuth);
      // Access the registered tool handlers via the internal server
      const tools = (server as any)._registeredTools;
      const searchTool = tools?.['search'];
      expect(searchTool).toBeDefined();

      const response = await searchTool.handler({ code: 'async () => spec.endpoints' });
      expect(response.content[0].text).toBe('["/api/health"]');
      expect(response.isError).toBeUndefined();
    });

    it('returns error content when runSearch throws', async () => {
      vi.mocked(runSearch).mockRejectedValue(new Error('Sandbox timeout'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const searchTool = tools?.['search'];

      const response = await searchTool.handler({ code: 'async () => { while(true) {} }' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Sandbox timeout');
    });

    it('handles non-Error thrown values', async () => {
      vi.mocked(runSearch).mockRejectedValue('string error');

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const searchTool = tools?.['search'];

      const response = await searchTool.handler({ code: 'bad code' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('string error');
    });

    it('passes the spec object to runSearch', async () => {
      vi.mocked(runSearch).mockResolvedValue('"ok"');

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      await tools['search'].handler({ code: 'async () => spec.info' });

      expect(runSearch).toHaveBeenCalledTimes(1);
      expect(runSearch).toHaveBeenCalledWith(
        'async () => spec.info',
        expect.objectContaining({ info: expect.any(Object) }),
      );
    });
  });

  describe('execute tool', () => {
    it('calls runExecute and returns result without logs', async () => {
      vi.mocked(runExecute).mockResolvedValue({ result: '{"status":"ok"}', logs: [] });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const executeTool = tools?.['execute'];

      const response = await executeTool.handler({
        code: 'async () => request({ path: "/api/health" })',
      });
      expect(response.content[0].text).toBe('{"status":"ok"}');
      expect(response.content[0].text).not.toContain('Logs');
    });

    it('appends logs to output when present', async () => {
      vi.mocked(runExecute).mockResolvedValue({
        result: '"done"',
        logs: ['log line 1', 'log line 2'],
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const executeTool = tools?.['execute'];

      const response = await executeTool.handler({
        code: 'async () => { console.log("hi"); return "done"; }',
      });
      expect(response.content[0].text).toContain('--- Logs ---');
      expect(response.content[0].text).toContain('log line 1');
      expect(response.content[0].text).toContain('log line 2');
    });

    it('returns error content when runExecute throws', async () => {
      vi.mocked(runExecute).mockRejectedValue(new Error('Origin mismatch'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const executeTool = tools?.['execute'];

      const response = await executeTool.handler({ code: 'bad' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Origin mismatch');
    });

    it('handles non-Error thrown values', async () => {
      vi.mocked(runExecute).mockRejectedValue(42);

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const executeTool = tools?.['execute'];

      const response = await executeTool.handler({ code: 'bad' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('42');
    });

    it('forwards baseUrl and callerAuth to runExecute', async () => {
      vi.mocked(runExecute).mockResolvedValue({ result: '"ok"', logs: [] });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      await tools['execute'].handler({ code: 'async () => "ok"' });

      expect(runExecute).toHaveBeenCalledWith('async () => "ok"', baseUrl, callerAuth);
    });
  });

  describe('browse tool', () => {
    it('calls runBrowse and formats output', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Home',
        headings: ['Welcome'],
        links: ['About → /about'],
        content: 'Main content here',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const browseTool = tools?.['browse'];

      const response = await browseTool.handler({ path: '/' });
      expect(response.content[0].text).toContain('Title: Home');
      expect(response.content[0].text).toContain('Welcome');
      expect(response.content[0].text).toContain('About → /about');
      expect(response.content[0].text).toContain('Main content here');
    });

    it('shows (none) for empty headings and links', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: '',
        headings: [],
        links: [],
        content: '',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const browseTool = tools?.['browse'];

      const response = await browseTool.handler({ path: '/' });
      expect(response.content[0].text).toContain('(none)');
      expect(response.content[0].text).toContain('(empty)');
    });

    it('returns error content when runBrowse throws', async () => {
      vi.mocked(runBrowse).mockRejectedValue(new Error('Browse must target'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const browseTool = tools?.['browse'];

      const response = await browseTool.handler({ path: 'http://evil.com' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Browse must target');
    });

    it('handles non-Error thrown values', async () => {
      vi.mocked(runBrowse).mockRejectedValue(null);

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const browseTool = tools?.['browse'];

      const response = await browseTool.handler({ path: '/' });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('null');
    });

    it('forwards path, baseUrl, and callerAuth to runBrowse', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: '',
        headings: [],
        links: [],
        content: '',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      await tools['browse'].handler({ path: '/pricing' });

      expect(runBrowse).toHaveBeenCalledWith('/pricing', baseUrl, callerAuth);
    });

    it('renders multiple headings and links correctly', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Page',
        headings: ['Heading One', 'Heading Two', 'Heading Three'],
        links: ['Home → /', 'About → /about', 'Contact → /contact'],
        content: 'Body text',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['browse'].handler({ path: '/' });

      const text = response.content[0].text;
      expect(text).toContain('  - Heading One');
      expect(text).toContain('  - Heading Two');
      expect(text).toContain('  - Heading Three');
      expect(text).toContain('  - Home → /');
      expect(text).toContain('  - About → /about');
      expect(text).toContain('  - Contact → /contact');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigate tool
  // ---------------------------------------------------------------------------

  describe('navigate tool', () => {
    it('is registered on the server', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      expect(tools?.['navigate']).toBeDefined();
    });

    it('crawls a single page with no internal links', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Standalone',
        headings: [],
        links: [],
        content: 'No links here',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/standalone' });

      expect(response.isError).toBeUndefined();
      const parsed = JSON.parse(response.content[0].text);
      expect(parsed['/standalone']).toBeDefined();
      expect(parsed['/standalone'].title).toBe('Standalone');
      expect(parsed['/standalone'].links).toEqual([]);
      expect(runBrowse).toHaveBeenCalledTimes(1);
    });

    it('follows internal links up to the default depth of 2', async () => {
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'Home',
          headings: [],
          links: ['About → /about', 'Pricing → /pricing'],
          content: 'Home page content that is somewhat long',
        })
        .mockResolvedValueOnce({
          title: 'About',
          headings: [],
          links: ['Team → /team'],
          content: 'About page',
        })
        .mockResolvedValueOnce({
          title: 'Pricing',
          headings: [],
          links: ['Signup → /signup'],
          content: 'Pricing page',
        })
        .mockResolvedValueOnce({
          title: 'Team',
          headings: [],
          links: [],
          content: 'Team page',
        })
        .mockResolvedValueOnce({
          title: 'Signup',
          headings: [],
          links: [],
          content: 'Signup page',
        });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed['/']).toBeDefined();
      expect(parsed['/about']).toBeDefined();
      expect(parsed['/pricing']).toBeDefined();
      expect(parsed['/team']).toBeDefined();
      expect(parsed['/signup']).toBeDefined();
      expect(runBrowse).toHaveBeenCalledTimes(5);
    });

    it('respects custom maxDepth parameter', async () => {
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'Root',
          headings: [],
          links: ['Child → /child'],
          content: 'Root',
        })
        .mockResolvedValueOnce({
          title: 'Child',
          headings: [],
          links: ['Grandchild → /grandchild'],
          content: 'Child',
        });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/', maxDepth: 1 });

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed['/']).toBeDefined();
      expect(parsed['/child']).toBeDefined();
      expect(parsed['/grandchild']).toBeUndefined();
      expect(runBrowse).toHaveBeenCalledTimes(2);
    });

    it('uses default depth of 2 when maxDepth is not provided', async () => {
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'L0',
          headings: [],
          links: ['L1 → /l1'],
          content: 'Level 0',
        })
        .mockResolvedValueOnce({
          title: 'L1',
          headings: [],
          links: ['L2 → /l2'],
          content: 'Level 1',
        })
        .mockResolvedValueOnce({
          title: 'L2',
          headings: [],
          links: ['L3 → /l3'],
          content: 'Level 2',
        });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      await tools['navigate'].handler({ startPath: '/' });

      // L3 should NOT be crawled because depth 0 -> L1 (depth 1) -> L2 (depth 2) -> L3 would be depth 3
      expect(runBrowse).toHaveBeenCalledTimes(3);
      expect(runBrowse).toHaveBeenCalledWith('/', baseUrl, callerAuth);
      expect(runBrowse).toHaveBeenCalledWith('/l1', baseUrl, callerAuth);
      expect(runBrowse).toHaveBeenCalledWith('/l2', baseUrl, callerAuth);
    });

    it('does not visit the same page twice', async () => {
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'Page A',
          headings: [],
          links: ['B → /b', 'A → /'],
          content: 'A links to B and back to A',
        })
        .mockResolvedValueOnce({
          title: 'Page B',
          headings: [],
          links: ['A → /'],
          content: 'B links back to A',
        });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      const parsed = JSON.parse(response.content[0].text);
      expect(Object.keys(parsed)).toHaveLength(2);
      expect(runBrowse).toHaveBeenCalledTimes(2);
    });

    it('skips pages already visited when they appear multiple times in the queue', async () => {
      // Two sibling pages (/a and /b) both link to /shared. When /shared is
      // queued from /a and then again from /b, the second dequeue should skip
      // it via the visited.has(item.path) continue branch.
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'Root',
          headings: [],
          links: ['A → /a', 'B → /b'],
          content: 'Root',
        })
        .mockResolvedValueOnce({
          title: 'Page A',
          headings: [],
          links: ['Shared → /shared'],
          content: 'A',
        })
        .mockResolvedValueOnce({
          title: 'Page B',
          headings: [],
          links: ['Shared → /shared'],
          content: 'B',
        })
        .mockResolvedValueOnce({
          title: 'Shared',
          headings: [],
          links: [],
          content: 'Shared page',
        });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      const parsed = JSON.parse(response.content[0].text);
      expect(Object.keys(parsed)).toHaveLength(4);
      // /shared should only be browsed once even though it was queued twice
      expect(runBrowse).toHaveBeenCalledTimes(4);
    });

    it('ignores external links in the link text', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Page',
        headings: [],
        links: [
          'Internal → /internal',
          'External → https://example.com',
          'Docs → http://docs.example.com',
        ],
        content: 'Page with mixed links',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;

      // Only the first page and /internal should be crawled; external links are ignored
      vi.mocked(runBrowse)
        .mockResolvedValueOnce({
          title: 'Page',
          headings: [],
          links: [
            'Internal → /internal',
            'External → https://example.com',
            'Docs → http://docs.example.com',
          ],
          content: 'Page with mixed links',
        })
        .mockResolvedValueOnce({
          title: 'Internal',
          headings: [],
          links: [],
          content: 'Internal page',
        });

      const response = await tools['navigate'].handler({ startPath: '/' });
      const parsed = JSON.parse(response.content[0].text);
      expect(parsed['/']).toBeDefined();
      expect(parsed['/internal']).toBeDefined();
      expect(Object.keys(parsed)).toHaveLength(2);
    });

    it('handles links without the arrow separator format', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Page',
        headings: [],
        links: ['No arrow format', 'Another bad link'],
        content: 'Page',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/', maxDepth: 1 });

      const parsed = JSON.parse(response.content[0].text);
      expect(Object.keys(parsed)).toHaveLength(1);
      expect(runBrowse).toHaveBeenCalledTimes(1);
    });

    it('truncates content preview to 200 characters', async () => {
      const longContent = 'A'.repeat(500);
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Long',
        headings: [],
        links: [],
        content: longContent,
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed['/'].contentPreview).toHaveLength(200);
    });

    it('returns error when crawl fails', async () => {
      vi.mocked(runBrowse).mockRejectedValue(new Error('Network failure'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Network failure');
    });

    it('returns error with non-Error thrown value', async () => {
      vi.mocked(runBrowse).mockRejectedValue(undefined);

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('undefined');
    });

    it('stops crawling at MAX_NAV_PAGES (20) pages', async () => {
      // Build a chain of 25 pages, each linking to the next
      const mockImplementation = (path: string) => {
        const pageNum = path === '/' ? 0 : parseInt(path.replace('/page', ''), 10);
        const nextPage = pageNum + 1;
        return Promise.resolve({
          title: `Page ${pageNum}`,
          headings: [],
          links: nextPage <= 25 ? [`Next → /page${nextPage}`] : [],
          content: `Content for page ${pageNum}`,
        });
      };
      vi.mocked(runBrowse).mockImplementation(mockImplementation);

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/', maxDepth: 30 });

      const parsed = JSON.parse(response.content[0].text);
      expect(Object.keys(parsed).length).toBeLessThanOrEqual(20);
      expect(runBrowse).toHaveBeenCalledTimes(20);
    });

    it('outputs valid JSON with indentation', async () => {
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'Page',
        headings: [],
        links: [],
        content: 'Content',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const response = await tools['navigate'].handler({ startPath: '/' });

      const text = response.content[0].text;
      // Indented JSON has newlines; a compact JSON.stringify would not
      expect(text).toContain('\n');
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // withMcpTool wrapper (tested indirectly through all tools, but verify
  // the consistent response shape across all registered tools)
  // ---------------------------------------------------------------------------

  describe('withMcpTool wrapper consistency', () => {
    it('all tool error responses have isError true and a text content item', async () => {
      vi.mocked(runSearch).mockRejectedValue(new Error('search fail'));
      vi.mocked(runExecute).mockRejectedValue(new Error('execute fail'));
      vi.mocked(runBrowse).mockRejectedValue(new Error('browse fail'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;

      const searchResponse = await tools['search'].handler({ code: 'bad' });
      const executeResponse = await tools['execute'].handler({ code: 'bad' });
      const browseResponse = await tools['browse'].handler({ path: '/' });
      const navigateResponse = await tools['navigate'].handler({ startPath: '/' });

      for (const response of [searchResponse, executeResponse, browseResponse, navigateResponse]) {
        expect(response.isError).toBe(true);
        expect(response.content).toHaveLength(1);
        expect(response.content[0].type).toBe('text');
        expect(response.content[0].text).toMatch(/^Error: /);
      }
    });

    it('all tool success responses have content array with text type', async () => {
      vi.mocked(runSearch).mockResolvedValue('"ok"');
      vi.mocked(runExecute).mockResolvedValue({ result: '"ok"', logs: [] });
      vi.mocked(runBrowse).mockResolvedValue({
        title: 'T',
        headings: [],
        links: [],
        content: '',
      });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;

      const searchResponse = await tools['search'].handler({ code: 'async () => "ok"' });
      const executeResponse = await tools['execute'].handler({ code: 'async () => "ok"' });
      const browseResponse = await tools['browse'].handler({ path: '/' });
      const navigateResponse = await tools['navigate'].handler({ startPath: '/' });

      for (const response of [searchResponse, executeResponse, browseResponse, navigateResponse]) {
        expect(response.isError).toBeUndefined();
        expect(response.content).toHaveLength(1);
        expect(response.content[0].type).toBe('text');
        expect(typeof response.content[0].text).toBe('string');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Tool registration completeness
  // ---------------------------------------------------------------------------

  describe('tool registration', () => {
    it('registers all four tools: search, execute, browse, navigate', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      expect(tools['search']).toBeDefined();
      expect(tools['execute']).toBeDefined();
      expect(tools['browse']).toBeDefined();
      expect(tools['navigate']).toBeDefined();
    });
  });
});
