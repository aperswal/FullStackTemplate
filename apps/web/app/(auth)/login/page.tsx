'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';
import { ROUTES } from '@/lib/routes';
import { OAuthButtons } from '@/app/(auth)/components/oauth-buttons';

export default function LoginPage(): React.ReactNode {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations('auth');
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete="current-password"
      />
    </div>
  );
}

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}: LoginFormProps) {
  const t = useTranslations('auth');

  return (
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
      <PasswordField value={password} onChange={setPassword} />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('signingIn') : t('signIn')}
      </Button>
    </form>
  );
}

function getCallbackUrl(searchParams: ReturnType<typeof useSearchParams>) {
  const raw = searchParams.get('callbackUrl') ?? ROUTES.dashboard;
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : ROUTES.dashboard;
}

function LoginContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const callbackUrl = getCallbackUrl(useSearchParams());
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
        <CardDescription>{t('signInToAccount')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          error={error}
          loading={loading}
          onSubmit={(e) => void handleSubmit(e)}
        />
        <OAuthButtons callbackUrl={callbackUrl} />
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
