'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthError({
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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('somethingWentWrong')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          {error.message !== '' ? error.message : t('unexpectedError')}
        </p>
        {error.digest !== undefined && error.digest !== '' && (
          <p className="text-muted-foreground text-xs">{t('errorId', { digest: error.digest })}</p>
        )}
        <Button onClick={reset}>{t('tryAgain')}</Button>
      </CardContent>
    </Card>
  );
}
