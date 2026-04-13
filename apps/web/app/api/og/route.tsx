import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { createErrorResponse, ServerError, ClientError } from '@/lib/errors';
import { getClientIp } from '@/lib/client-ip';
import messages from '@/messages/en.json';

export const runtime = 'edge';

const MS_PER_SECOND = 1000;

// Simple edge-compatible rate limiter (30 req/min per IP)
const OG_RATE_LIMIT = 30;
const OG_RATE_WINDOW = 60;
const MAX_OG_STORE_SIZE = 10_000;
const ogRateStore = new Map<string, { count: number; resetAt: number }>();

function checkOgRateLimit(ip: string): boolean {
  const now = Math.floor(Date.now() / MS_PER_SECOND);
  const entry = ogRateStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    if (ogRateStore.size >= MAX_OG_STORE_SIZE) {
      for (const [key, val] of ogRateStore) {
        if (val.resetAt <= now) {
          ogRateStore.delete(key);
        }
      }
      if (ogRateStore.size >= MAX_OG_STORE_SIZE) {
        return true;
      }
    }
    ogRateStore.set(ip, { count: 1, resetAt: now + OG_RATE_WINDOW });
    return true;
  }

  entry.count += 1;
  return entry.count <= OG_RATE_LIMIT;
}

function OgImageTemplate({ title, appName }: { title: string; appName: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 80px',
          maxWidth: '80%',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.7,
            textAlign: 'center',
          }}
        >
          {appName}
        </div>
      </div>
    </div>
  );
}

export function GET(request: NextRequest): Response {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request.headers);

  if (!checkOgRateLimit(ip)) {
    const response = createErrorResponse(
      new ClientError('Too many requests. Please try again later.', { statusCode: 429 }),
    );
    response.headers.set('x-request-id', requestId);
    return response;
  }

  try {
    const MAX_TITLE_LENGTH = 200;
    const { searchParams } = request.nextUrl;
    const rawTitle = searchParams.get('title') ?? messages.common.appName;
    const title = rawTitle.slice(0, MAX_TITLE_LENGTH);

    const response = new ImageResponse(
      <OgImageTemplate title={title} appName={messages.common.appName} />,
      { width: 1200, height: 630 },
    );
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console -- Edge runtime: pino unavailable
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'OG image generation failed',
        requestId,
        error: String(error),
      }),
    );
    const response = createErrorResponse(new ServerError('OG image generation failed'));
    response.headers.set('x-request-id', requestId);
    return response;
  }
}
