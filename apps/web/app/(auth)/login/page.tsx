'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { ROUTES } from '@/lib/routes';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl') ?? ROUTES.dashboard;
  const callbackUrl =
    rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : ROUTES.dashboard;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? t('signInFailed'));
      setLoading(false);
      return;
    }

    trackEvent('login_success', { method: 'email' });
    router.push(callbackUrl);
  }

  async function handleOAuth(provider: 'google' | 'github') {
    trackEvent('auth_oauth_initiated', { provider });
    await signIn.social({ provider, callbackURL: callbackUrl });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
        <CardDescription>{t('signInToAccount')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              <Link
                href={ROUTES.resetPassword}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">{tc('or')}</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => handleOAuth('google')}>
            {t('continueWithGoogle')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOAuth('github')}>
            {t('continueWithGitHub')}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href={ROUTES.signup} className="text-primary hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
