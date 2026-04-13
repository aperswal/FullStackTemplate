'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('[ErrorBoundary]', error.message, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t('somethingWentWrong')}</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {error.message !== '' ? error.message : t('unexpectedError')}
        </p>
        {error.digest !== undefined && error.digest !== '' && (
          <p className="text-muted-foreground text-xs">{t('errorId', { digest: error.digest })}</p>
        )}
      </div>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  );
}
