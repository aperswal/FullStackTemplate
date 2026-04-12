import { runInNewContext } from 'node:vm';

import type { AppSpec } from './types';

export interface CallerAuth {
  cookies?: string;
  authorization?: string;
}

export async function runSearch(code: string, appSpec: AppSpec): Promise<string> {
  const wrappedCode = `(${code})()`;

  const context = {
    spec: structuredClone(appSpec),
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Date,
    RegExp,
    Map,
    Set,
    console: { log: () => {}, warn: () => {}, error: () => {} },
  };

  const result = await runInNewContext(wrappedCode, context, {
    timeout: 5_000,
    displayErrors: true,
  });

  return JSON.stringify(result, null, 2);
}

export async function runExecute(
  code: string,
  baseUrl: string,
  callerAuth: CallerAuth,
): Promise<{ result: string; logs: string[] }> {
  const logs: string[] = [];
  const wrappedCode = `(${code})()`;
  const allowedOrigin = new URL(baseUrl).origin;

  const requestFn = async (opts: {
    method?: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
  }) => {
    const url = new URL(opts.path, baseUrl);

    if (url.origin !== allowedOrigin) {
      throw new Error(`Requests must target ${allowedOrigin}. Got: ${url.origin}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...opts.headers,
    };

    // Forward the MCP caller's auth context so the app enforces its own access control
    if (callerAuth.cookies) {
      headers['cookie'] = callerAuth.cookies;
    }
    if (callerAuth.authorization) {
      headers['authorization'] = callerAuth.authorization;
    }

    const fetchOpts: RequestInit = {
      method: opts.method ?? 'GET',
      headers,
    };

    if (opts.body && fetchOpts.method !== 'GET') {
      fetchOpts.body = JSON.stringify(opts.body);
    }

    const response = await fetch(url.toString(), fetchOpts);
    const contentType = response.headers.get('content-type') ?? '';

    let data: unknown;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  };

  const context = {
    request: requestFn,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Date,
    RegExp,
    Map,
    Set,
    URL,
    URLSearchParams,
    console: {
      log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(' ')}`),
      error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(' ')}`),
    },
  };

  const result = await runInNewContext(wrappedCode, context, {
    timeout: 10_000,
    displayErrors: true,
  });

  return {
    result: JSON.stringify(result, null, 2),
    logs,
  };
}

export async function runBrowse(
  path: string,
  baseUrl: string,
  callerAuth: CallerAuth,
): Promise<{ title: string; headings: string[]; links: string[]; content: string }> {
  const url = new URL(path, baseUrl);

  if (url.origin !== new URL(baseUrl).origin) {
    throw new Error(`Browse must target ${baseUrl}. Got: ${url.origin}`);
  }

  const headers: Record<string, string> = { Accept: 'text/html' };
  if (callerAuth.cookies) {
    headers['cookie'] = callerAuth.cookies;
  }
  if (callerAuth.authorization) {
    headers['authorization'] = callerAuth.authorization;
  }

  const response = await fetch(url.toString(), { headers });
  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const headings: string[] = [];
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headings.push(stripHtml(headingMatch[1]));
  }

  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = stripHtml(linkMatch[2]);
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(`${text} → ${href}`);
    }
  }

  const content = stripHtml(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ''),
  ).slice(0, 4000);

  return { title, headings, links, content };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
