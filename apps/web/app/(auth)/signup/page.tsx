'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signIn, signUp } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { ROUTES } from '@/lib/routes';

export default function SignupPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    const result = await signUp.email({ email, password, name });

    if (result.error) {
      setError(result.error.message ?? t('signUpFailed'));
      setLoading(false);
      return;
    }

    trackEvent('signup_success', { method: 'email' });
    router.push(ROUTES.dashboard);
  }

  async function handleOAuth(provider: 'google' | 'github') {
    trackEvent('auth_oauth_initiated', { provider });
    await signIn.social({ provider, callbackURL: ROUTES.dashboard });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('createAccount')}</CardTitle>
        <CardDescription>{t('getStartedFree')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('creatingAccount') : t('createAccountButton')}
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
          {t('alreadyHaveAccount')}{' '}
          <Link href={ROUTES.login} className="text-primary hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
