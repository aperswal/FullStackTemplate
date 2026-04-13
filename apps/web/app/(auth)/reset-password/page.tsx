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
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/constants';
import { ROUTES } from '@/lib/routes';

export default function ResetPasswordPage(): React.ReactNode {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token !== null && token !== '') {
    return <SetNewPassword token={token} />;
  }

  return <RequestReset />;
}

function ResetLinkSentConfirmation({ email }: { email: string }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');

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

interface ResetFormProps {
  email: string;
  setEmail: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function RequestResetForm({ email, setEmail, error, loading, onSubmit }: ResetFormProps) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
        <CardDescription>{t('resetPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error !== '' && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
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

function RequestReset() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');

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
    return <ResetLinkSentConfirmation email={email} />;
  }

  return (
    <RequestResetForm
      email={email}
      setEmail={setEmail}
      error={error}
      loading={loading}
      onSubmit={(e) => void handleSubmit(e)}
    />
  );
}

function PasswordUpdatedConfirmation() {
  const t = useTranslations('auth');

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

function NewPasswordFields({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
}) {
  const t = useTranslations('auth');
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={PASSWORD_MIN_LENGTH}
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
    </>
  );
}

interface NewPasswordFormProps {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function SetNewPasswordForm(props: NewPasswordFormProps) {
  const t = useTranslations('auth');
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('setNewPassword')}</CardTitle>
        <CardDescription>{t('setNewPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={props.onSubmit} className="space-y-4">
          {props.error !== '' && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {props.error}
            </div>
          )}
          <NewPasswordFields
            password={props.password}
            setPassword={props.setPassword}
            confirmPassword={props.confirmPassword}
            setConfirmPassword={props.setConfirmPassword}
          />
          <Button type="submit" className="w-full" disabled={props.loading}>
            {props.loading ? t('updating') : t('updatePassword')}
          </Button>
        </form>
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

    if (password.length < PASSWORD_MIN_LENGTH) {
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
    return <PasswordUpdatedConfirmation />;
  }

  return (
    <SetNewPasswordForm
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      error={error}
      loading={loading}
      onSubmit={(e) => void handleSubmit(e)}
    />
  );
}
