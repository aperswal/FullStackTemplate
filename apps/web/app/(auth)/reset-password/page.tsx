'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/client';
import { ROUTES } from '@/lib/routes';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <SetNewPassword token={token} />;
  }

  return <RequestReset />;
}

function RequestReset() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: ROUTES.resetPassword,
    });

    if (result.error) {
      setError(result.error.message ?? t('failedToSendReset'));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('checkYourEmail')}</CardTitle>
          <CardDescription>{t('resetLinkSent', { email })}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={ROUTES.login} className="text-sm text-primary hover:underline">
            {tc('backToSignIn')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
        <CardDescription>{t('resetPasswordDescription')}</CardDescription>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('sending') : t('sendResetLink')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href={ROUTES.login} className="text-primary hover:underline">
            {tc('backToSignIn')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function SetNewPassword({ token }: { token: string }) {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    const result = await authClient.resetPassword({ newPassword: password, token });

    if (result.error) {
      setError(result.error.message ?? t('failedToReset'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('passwordUpdated')}</CardTitle>
          <CardDescription>{t('passwordResetSuccess')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href={ROUTES.login} className={buttonVariants()}>
            {t('signIn')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('setNewPassword')}</CardTitle>
        <CardDescription>{t('setNewPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{t('newPassword')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('updating') : t('updatePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
