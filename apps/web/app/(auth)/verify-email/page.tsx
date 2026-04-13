'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { ROUTES } from '@/lib/routes';

export default function VerifyEmailPage(): React.ReactNode {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token === null || token === '') {
      setStatus('error');
      return;
    }

    authClient
      .verifyEmail({ query: { token } })
      .then((result) => {
        if (result.error) {
          setStatus('error');
        } else {
          setStatus('success');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('emailVerification')}</CardTitle>
        <CardDescription>
          {status === 'loading' && t('verifyingEmail')}
          {status === 'success' && t('emailVerified')}
          {status === 'error' && t('verificationFailed')}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {status === 'success' && (
          <Link href={ROUTES.dashboard} className={buttonVariants()}>
            {t('goToDashboard')}
          </Link>
        )}
        {status === 'error' && (
          <p className="text-sm text-muted-foreground">
            {t('verificationExpired')}{' '}
            <Link href={ROUTES.login} className="text-primary hover:underline">
              {t('signInToRequestNew')}
            </Link>{' '}
            {t('toRequestNewLink')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
