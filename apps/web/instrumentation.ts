import { ServerError } from '@/lib/errors';

function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

export async function validateEnvCrossConstraints(): Promise<void> {
  if (isSet(process.env.SKIP_ENV_VALIDATION)) {
    return;
  }

  const { env } = await import('./lib/env');

  if (isSet(env.STRIPE_SECRET_KEY) && !isSet(env.STRIPE_WEBHOOK_SECRET)) {
    throw new ServerError(
      'ENV: STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing. Both are required for Stripe integration.',
    );
  }

  if (env.DEPLOY_TARGET === 'vercel' && !isSet(env.RESEND_API_KEY)) {
    // eslint-disable-next-line no-console -- Runs before structured logger is available
    console.warn(
      'ENV WARNING: DEPLOY_TARGET=vercel but RESEND_API_KEY is not set. Email sending will fail.',
    );
  }

  if (env.NODE_ENV === 'production' && env.EMAIL_FROM === 'noreply@example.com') {
    // eslint-disable-next-line no-console -- Runs before structured logger is available
    console.warn(
      'ENV WARNING: EMAIL_FROM is still the default "noreply@example.com" in production. Set a real sender address.',
    );
  }

  if (isSet(env.UPSTASH_REDIS_REST_URL) !== isSet(env.UPSTASH_REDIS_REST_TOKEN)) {
    throw new ServerError(
      'ENV: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set or both be empty.',
    );
  }
}

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await validateEnvCrossConstraints();
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } =
      await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'fullstack-template-web',
      }),
      traceExporter: isSet(otlpEndpoint) ? new OTLPTraceExporter({ url: otlpEndpoint }) : undefined,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-winston': { enabled: false },
        }),
      ],
    });

    sdk.start();
  }
}
