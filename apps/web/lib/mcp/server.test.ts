import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createMcpServer } from './server';
import type { CallerAuth } from './sandbox';

// Mock the sandbox functions so we can test server tool wiring without real execution
vi.mock('./sandbox', () => ({
  runSearch: vi.fn(),
  runExecute: vi.fn(),
}));

import { runSearch, runExecute } from './sandbox';

describe('createMcpServer', () => {
  const baseUrl = 'http://localhost:3000';
  const callerAuth: CallerAuth = { cookies: 'session=abc', authorization: 'Bearer tok' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a server with expected name and version', () => {
    const server = createMcpServer(baseUrl, callerAuth);
    expect((server.server as any)._serverInfo).toEqual({
      name: 'fullstack-template',
      version: '1.0.0',
    });
  });

  it('forwards empty auth context to tools', async () => {
    const server = createMcpServer(baseUrl, {});
    const tools = (server as any)._registeredTools;

    vi.mocked(runExecute).mockResolvedValue({ result: '"ok"', logs: [] });
    await tools['execute'].handler({ code: 'async () => "ok"' });

    expect(runExecute).toHaveBeenCalledWith('async () => "ok"', baseUrl, {});
  });

  // ---------------------------------------------------------------------------
  // Resources
  // ---------------------------------------------------------------------------

  describe('resources', () => {
    it('registers site-info resource with site name and description', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      const siteInfo = resources?.['site://info'];
      expect(siteInfo).toBeDefined();

      const result = siteInfo.readCallback(new URL('site://info'));
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('site://info');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toContain('FullStack Template');
      expect(result.contents[0].text).toContain('search tool');
      expect(result.contents[0].text).toContain('execute tool');
    });

    it('does not register developer-facing resources', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const resources = (server as any)._registeredResources;
      expect(resources?.['api://spec']).toBeUndefined();
      expect(resources?.['docs://auth-model']).toBeUndefined();
      expect(resources?.['docs://subscription-tiers']).toBeUndefined();
      expect(resources?.['app://sitemap']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Prompts (removed - no dev-facing prompts in user-facing server)
  // ---------------------------------------------------------------------------

  describe('prompts', () => {
    it('does not register any prompts', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const prompts = (server as any)._registeredPrompts;
      expect(prompts?.['debug-webhook']).toBeUndefined();
      expect(prompts?.['investigate-user']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------

  describe('search tool', () => {
    it('calls runSearch and returns result on success', async () => {
      vi.mocked(runSearch).mockResolvedValue('["/"]');

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const searchTool = tools?.['search'];
      expect(searchTool).toBeDefined();

      const response = await searchTool.handler({ code: 'async () => spec.pages' });
      expect(response.content[0].text).toBe('["/"]');
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

    it('passes the site spec object to runSearch', async () => {
      vi.mocked(runSearch).mockResolvedValue('"ok"');

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      await tools['search'].handler({ code: 'async () => spec.site' });

      expect(runSearch).toHaveBeenCalledTimes(1);
      expect(runSearch).toHaveBeenCalledWith(
        'async () => spec.site',
        expect.objectContaining({
          site: expect.any(Object),
          pages: expect.any(Array),
          actions: expect.any(Array),
        }),
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

    it('tool description mentions browse and request helpers', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      const executeTool = tools?.['execute'];
      expect(executeTool.description).toContain('browse');
      expect(executeTool.description).toContain('request');
    });
  });

  // ---------------------------------------------------------------------------
  // withMcpTool wrapper consistency
  // ---------------------------------------------------------------------------

  describe('withMcpTool wrapper consistency', () => {
    it('all tool error responses have isError true and a text content item', async () => {
      vi.mocked(runSearch).mockRejectedValue(new Error('search fail'));
      vi.mocked(runExecute).mockRejectedValue(new Error('execute fail'));

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;

      const searchResponse = await tools['search'].handler({ code: 'bad' });
      const executeResponse = await tools['execute'].handler({ code: 'bad' });

      for (const response of [searchResponse, executeResponse]) {
        expect(response.isError).toBe(true);
        expect(response.content).toHaveLength(1);
        expect(response.content[0].type).toBe('text');
        expect(response.content[0].text).toMatch(/^Error: /);
      }
    });

    it('all tool success responses have content array with text type', async () => {
      vi.mocked(runSearch).mockResolvedValue('"ok"');
      vi.mocked(runExecute).mockResolvedValue({ result: '"ok"', logs: [] });

      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;

      const searchResponse = await tools['search'].handler({ code: 'async () => "ok"' });
      const executeResponse = await tools['execute'].handler({ code: 'async () => "ok"' });

      for (const response of [searchResponse, executeResponse]) {
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
    it('registers exactly two tools: search and execute', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      expect(tools['search']).toBeDefined();
      expect(tools['execute']).toBeDefined();
      expect(Object.keys(tools)).toHaveLength(2);
    });

    it('does not register legacy browse or navigate tools', () => {
      const server = createMcpServer(baseUrl, callerAuth);
      const tools = (server as any)._registeredTools;
      expect(tools['browse']).toBeUndefined();
      expect(tools['navigate']).toBeUndefined();
    });
  });
});
