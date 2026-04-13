import { runInNewContext } from 'node:vm';

import { ClientError } from '@/lib/errors';

import type { AppSpec } from './types';

export interface CallerAuth {
  cookies?: string;
  authorization?: string;
}

const SEARCH_TIMEOUT_MS = 5_000;
const EXECUTE_TIMEOUT_MS = 10_000;
const JSON_INDENT_SPACES = 2;
const BROWSE_CONTENT_MAX_LENGTH = 4000;

function applyAuthHeaders(headers: Record<string, string>, auth: CallerAuth): void {
  if (auth.cookies !== undefined && auth.cookies !== '') {
    headers['cookie'] = auth.cookies;
  }
  if (auth.authorization !== undefined && auth.authorization !== '') {
    headers['authorization'] = auth.authorization;
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : '';
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push(stripHtml(match[1]));
  }
  return headings;
}

function extractLinks(html: string): string[] {
  const links: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = stripHtml(match[2]);
    if (
      href !== undefined &&
      href !== '' &&
      !href.startsWith('#') &&
      !href.startsWith('javascript:')
    ) {
      links.push(`${text} → ${href}`);
    }
  }
  return links;
}

function extractContent(html: string): string {
  return stripHtml(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ''),
  ).slice(0, BROWSE_CONTENT_MAX_LENGTH);
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
    timeout: SEARCH_TIMEOUT_MS,
    displayErrors: true,
  });

  return JSON.stringify(result, null, JSON_INDENT_SPACES);
}

interface SandboxRequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function createSandboxedRequest(baseUrl: string, callerAuth: CallerAuth) {
  const allowedOrigin = new URL(baseUrl).origin;

  return async (opts: SandboxRequestOptions) => {
    const url = new URL(opts.path, baseUrl);

    if (url.origin !== allowedOrigin) {
      throw new ClientError(`Requests must target ${allowedOrigin}. Got: ${url.origin}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...opts.headers,
    };
    applyAuthHeaders(headers, callerAuth);

    const fetchOpts: RequestInit = { method: opts.method ?? 'GET', headers };
    if (opts.body !== undefined && opts.body !== null && fetchOpts.method !== 'GET') {
      fetchOpts.body = JSON.stringify(opts.body);
    }

    const response = await fetch(url.toString(), fetchOpts);
    const contentType = response.headers.get('content-type') ?? '';

    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  };
}

function createSandboxContext(
  requestFn: ReturnType<typeof createSandboxedRequest>,
  logs: string[],
) {
  return {
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
}

export async function runExecute(
  code: string,
  baseUrl: string,
  callerAuth: CallerAuth,
): Promise<{ result: string; logs: string[] }> {
  const logs: string[] = [];
  const wrappedCode = `(${code})()`;

  const requestFn = createSandboxedRequest(baseUrl, callerAuth);
  const context = createSandboxContext(requestFn, logs);

  const result = await runInNewContext(wrappedCode, context, {
    timeout: EXECUTE_TIMEOUT_MS,
    displayErrors: true,
  });

  return {
    result: JSON.stringify(result, null, JSON_INDENT_SPACES),
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
    throw new ClientError(`Browse must target ${baseUrl}. Got: ${url.origin}`);
  }

  const headers: Record<string, string> = { Accept: 'text/html' };
  applyAuthHeaders(headers, callerAuth);

  const response = await fetch(url.toString(), { headers });
  const html = await response.text();

  return {
    title: extractTitle(html),
    headings: extractHeadings(html),
    links: extractLinks(html),
    content: extractContent(html),
  };
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
