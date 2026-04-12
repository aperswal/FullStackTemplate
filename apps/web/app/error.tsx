'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('error-boundary');

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error({ err: error, digest: error.digest }, 'Unhandled error');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>}
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
