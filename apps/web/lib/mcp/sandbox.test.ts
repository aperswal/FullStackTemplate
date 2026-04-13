import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { runSearch, runExecute } from './sandbox';
import { spec } from './spec';
import type { CallerAuth } from './sandbox';

describe('runSearch', () => {
  it('returns all page paths', async () => {
    const result = await runSearch('async () => spec.pages.map(p => p.path)', spec);
    const paths = JSON.parse(result) as string[];
    expect(paths).toContain('/');
    expect(paths).toContain('/pricing');
    expect(paths).toContain('/dashboard');
  });

  it('filters pages by auth requirement', async () => {
    const result = await runSearch(
      'async () => spec.pages.filter(p => p.auth).map(p => p.path)',
      spec,
    );
    const paths = JSON.parse(result) as string[];
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/settings');
    expect(paths).not.toContain('/');
  });

  it('returns public actions', async () => {
    const result = await runSearch(
      'async () => spec.actions.filter(a => !a.auth).map(a => a.name)',
      spec,
    );
    const actions = JSON.parse(result) as string[];
    expect(actions).toContain('sign_up');
    expect(actions).toContain('sign_in');
    expect(actions).toContain('check_health');
  });

  it('returns authenticated actions', async () => {
    const result = await runSearch(
      'async () => spec.actions.filter(a => a.auth).map(a => a.name)',
      spec,
    );
    const actions = JSON.parse(result) as string[];
    expect(actions).toContain('get_session');
    expect(actions).toContain('sign_out');
    expect(actions).not.toContain('check_health');
  });

  it('returns site info', async () => {
    const result = await runSearch('async () => spec.site', spec);
    const site = JSON.parse(result) as { name: string; description: string; features: string[] };
    expect(site.name).toBe('FullStack Template');
    expect(Array.isArray(site.features)).toBe(true);
    expect(site.features.length).toBeGreaterThan(0);
  });

  it('rejects code that exceeds timeout', async () => {
    await expect(runSearch('async () => { while(true) {} }', spec)).rejects.toThrow();
  }, 10_000);

  it('cannot access process or require', async () => {
    await expect(runSearch('async () => process.env', spec)).rejects.toThrow();
  });

  it('returns JSON-stringified results', async () => {
    const result = await runSearch('async () => ({ count: spec.pages.length })', spec);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('count');
    expect(typeof parsed.count).toBe('number');
  });

  it('allows calling console.log/warn/error inside the sandbox (no-op stubs)', async () => {
    const result = await runSearch(
      'async () => { console.log("info"); console.warn("warning"); console.error("err"); return "ok"; }',
      spec,
    );
    expect(JSON.parse(result)).toBe('ok');
  });

  it('provides built-in globals in sandbox context', async () => {
    const result = await runSearch(
      'async () => ({ hasArray: typeof Array, hasMap: typeof Map, hasSet: typeof Set, hasMath: typeof Math })',
      spec,
    );
    const parsed = JSON.parse(result);
    expect(parsed.hasArray).toBe('function');
    expect(parsed.hasMap).toBe('function');
    expect(parsed.hasSet).toBe('function');
    expect(parsed.hasMath).toBe('object');
  });
});

describe('runExecute', () => {
  const baseUrl = 'http://localhost:3000';
  const callerAuth: CallerAuth = {};

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ status: 'healthy' }),
        text: () => Promise.resolve('OK'),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('request helper', () => {
    it('executes request and returns result', async () => {
      const { result } = await runExecute(
        'async () => await request({ method: "GET", path: "/api/health" })',
        baseUrl,
        callerAuth,
      );
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe(200);
      expect(parsed.ok).toBe(true);
    });

    it('captures console.log output', async () => {
      const { logs } = await runExecute(
        'async () => { console.log("hello", "world"); return "done"; }',
        baseUrl,
        callerAuth,
      );
      expect(logs).toContain('hello world');
    });

    it('captures console.warn with prefix', async () => {
      const { logs } = await runExecute(
        'async () => { console.warn("something"); return "done"; }',
        baseUrl,
        callerAuth,
      );
      expect(logs).toContain('[warn] something');
    });

    it('captures console.error with prefix', async () => {
      const { logs } = await runExecute(
        'async () => { console.error("failure"); return "done"; }',
        baseUrl,
        callerAuth,
      );
      expect(logs).toContain('[error] failure');
    });

    it('rejects requests to different origins', async () => {
      await expect(
        runExecute(
          'async () => await request({ method: "GET", path: "http://evil.com/steal" })',
          baseUrl,
          callerAuth,
        ),
      ).rejects.toThrow('Requests must target');
    });

    it('forwards cookies when present in callerAuth', async () => {
      const authWithCookies: CallerAuth = { cookies: 'session=abc123' };
      await runExecute(
        'async () => await request({ method: "GET", path: "/api/health" })',
        baseUrl,
        authWithCookies,
      );
      const fetchMock = vi.mocked(fetch);
      const callHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders['cookie']).toBe('session=abc123');
    });

    it('forwards authorization when present in callerAuth', async () => {
      const authWithBearer: CallerAuth = { authorization: 'Bearer token123' };
      await runExecute(
        'async () => await request({ method: "GET", path: "/api/health" })',
        baseUrl,
        authWithBearer,
      );
      const fetchMock = vi.mocked(fetch);
      const callHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders['authorization']).toBe('Bearer token123');
    });

    it('sends JSON body for non-GET requests', async () => {
      await runExecute(
        'async () => await request({ method: "POST", path: "/api/test", body: { key: "value" } })',
        baseUrl,
        callerAuth,
      );
      const fetchMock = vi.mocked(fetch);
      expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ key: 'value' }));
    });

    it('does not send body for GET requests even if provided', async () => {
      await runExecute(
        'async () => await request({ method: "GET", path: "/api/test", body: { key: "value" } })',
        baseUrl,
        callerAuth,
      );
      const fetchMock = vi.mocked(fetch);
      expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
    });

    it('defaults to GET method when not specified', async () => {
      await runExecute('async () => await request({ path: "/api/health" })', baseUrl, callerAuth);
      const fetchMock = vi.mocked(fetch);
      expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
    });

    it('handles text responses when content-type is not JSON', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'text/html' }),
          json: () => Promise.reject(new Error('not json')),
          text: () => Promise.resolve('<html>Hello</html>'),
        }),
      );

      const { result } = await runExecute(
        'async () => await request({ method: "GET", path: "/api/page" })',
        baseUrl,
        callerAuth,
      );
      const parsed = JSON.parse(result);
      expect(parsed.data).toBe('<html>Hello</html>');
    });

    it('handles responses with no content-type header', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          ok: true,
          headers: new Headers(),
          json: () => Promise.reject(new Error('not json')),
          text: () => Promise.resolve('plain text'),
        }),
      );

      const { result } = await runExecute(
        'async () => await request({ method: "GET", path: "/api/plain" })',
        baseUrl,
        callerAuth,
      );
      const parsed = JSON.parse(result);
      expect(parsed.data).toBe('plain text');
    });

    it('provides URL and URLSearchParams in sandbox', async () => {
      const { result } = await runExecute(
        'async () => { const u = new URL("http://localhost:3000/test"); return u.pathname; }',
        baseUrl,
        callerAuth,
      );
      expect(JSON.parse(result)).toBe('/test');
    });

    it('rejects code that exceeds timeout', async () => {
      await expect(
        runExecute('async () => { while(true) {} }', baseUrl, callerAuth),
      ).rejects.toThrow();
    }, 15_000);

    it('passes custom headers through to fetch', async () => {
      await runExecute(
        'async () => await request({ method: "GET", path: "/api/health", headers: { "X-Custom": "test" } })',
        baseUrl,
        callerAuth,
      );
      const fetchMock = vi.mocked(fetch);
      const callHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders['X-Custom']).toBe('test');
    });
  });

  describe('browse helper', () => {
    it('extracts title from HTML', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () =>
            Promise.resolve('<html><head><title>My Page</title></head><body></body></html>'),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('My Page');
    });

    it('returns empty title when none exists', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () => Promise.resolve('<html><body>No title</body></html>'),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('');
    });

    it('extracts headings from HTML', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () =>
            Promise.resolve('<html><body><h1>Main Title</h1><h2>Sub Title</h2></body></html>'),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.headings).toEqual(['Main Title', 'Sub Title']);
    });

    it('extracts links from HTML, skipping anchors and javascript:', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () =>
            Promise.resolve(
              '<html><body><a href="/about">About</a><a href="#top">Top</a><a href="javascript:void(0)">JS</a></body></html>',
            ),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.links).toHaveLength(1);
      expect(parsed.links[0]).toContain('About');
      expect(parsed.links[0]).toContain('/about');
    });

    it('strips scripts, styles, nav, header, and footer from content', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () =>
            Promise.resolve(
              '<html><body><script>alert("xss")</script><style>.x{}</style><nav>Nav</nav><header>Header</header><footer>Footer</footer><main>Real Content</main></body></html>',
            ),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.content).toContain('Real Content');
      expect(parsed.content).not.toContain('alert');
      expect(parsed.content).not.toContain('Nav');
      expect(parsed.content).not.toContain('Header');
      expect(parsed.content).not.toContain('Footer');
    });

    it('rejects browsing a different origin', async () => {
      await expect(
        runExecute('async () => await browse("http://evil.com/page")', baseUrl, callerAuth),
      ).rejects.toThrow('Browse must target');
    });

    it('forwards cookies when present', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () => Promise.resolve('<html><body></body></html>'),
          headers: new Headers(),
        }),
      );

      const authWithCookies: CallerAuth = { cookies: 'session=abc' };
      await runExecute('async () => await browse("/")', baseUrl, authWithCookies);
      const fetchMock = vi.mocked(fetch);
      const callHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders['cookie']).toBe('session=abc');
    });

    it('forwards authorization when present', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () => Promise.resolve('<html><body></body></html>'),
          headers: new Headers(),
        }),
      );

      const authWithBearer: CallerAuth = { authorization: 'Bearer xyz' };
      await runExecute('async () => await browse("/")', baseUrl, authWithBearer);
      const fetchMock = vi.mocked(fetch);
      const callHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders['authorization']).toBe('Bearer xyz');
    });

    it('strips HTML entities from content', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () =>
            Promise.resolve(
              '<html><body>&amp; &lt;tag&gt; &quot;quoted&quot; &#39;apos&#39;</body></html>',
            ),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.content).toContain('& <tag> "quoted" \'apos\'');
    });

    it('truncates content to 4000 characters', async () => {
      const longContent = 'A'.repeat(5000);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: () => Promise.resolve(`<html><body>${longContent}</body></html>`),
          headers: new Headers(),
        }),
      );

      const { result } = await runExecute('async () => await browse("/")', baseUrl, callerAuth);
      const parsed = JSON.parse(result);
      expect(parsed.content.length).toBeLessThanOrEqual(4000);
    });

    it('can combine browse and request in a single execute call', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          text: () => Promise.resolve('<html><head><title>Home</title></head><body></body></html>'),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ status: 'healthy' }),
          text: () => Promise.resolve(''),
        });
      vi.stubGlobal('fetch', fetchMock);

      const { result } = await runExecute(
        `async () => {
          const home = await browse("/");
          const health = await request({ method: "GET", path: "/api/health" });
          return { title: home.title, health: health.data };
        }`,
        baseUrl,
        callerAuth,
      );
      const parsed = JSON.parse(result);
      expect(parsed.title).toBe('Home');
      expect(parsed.health.status).toBe('healthy');
    });
  });
});
