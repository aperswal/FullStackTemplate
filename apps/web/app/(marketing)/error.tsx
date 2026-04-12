'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';

const log = createLogger('marketing-error-boundary');

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    log.error({ err: error, digest: error.digest }, 'Unhandled error in marketing section');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t('somethingWentWrong')}</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {error.message || t('unexpectedError')}
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-xs">{t('errorId', { digest: error.digest })}</p>
        )}
      </div>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  );
}
