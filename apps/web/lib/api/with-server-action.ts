import { headers } from 'next/headers';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { auth } from '@/lib/auth/server';
import { ClientError } from '@/lib/errors';
import { createLogger, withCorrelation } from '@/lib/logger';

const log = createLogger('server-action');

interface ServerActionContext {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
}

/**
 * Wraps a server action with authentication, correlation ID propagation, and
 * structured error logging. The action receives a verified session.
 */
export function withServerAction<TInput, TOutput>(
  name: string,
  action: (input: TInput, context: ServerActionContext) => Promise<TOutput>,
) {
  return async (input: TInput): Promise<TOutput> => {
    const correlationId = crypto.randomUUID();

    return withCorrelation(correlationId, async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session) {
        log.warn({ action: name }, 'Unauthenticated server action attempt');
        throw new ClientError('Not authenticated', { statusCode: 401 });
      }

      try {
        const result = await action(input, { session });
        log.debug({ action: name, userId: session.user.id }, 'Server action completed');
        return result;
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }
        if (error instanceof ClientError) {
          throw error;
        }
        log.error({ action: name, userId: session.user.id, err: error }, 'Server action failed');
        throw error;
      }
    });
  };
}
