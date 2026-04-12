'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
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
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && 'Your email has been verified!'}
          {status === 'error' && 'Verification failed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {status === 'success' && (
          <Link href="/dashboard" className={buttonVariants()}>
            Go to Dashboard
          </Link>
        )}
        {status === 'error' && (
          <p className="text-sm text-muted-foreground">
            The verification link may have expired.{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to request a new one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
