'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth/client';
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/constants';
import { trackEvent } from '@/lib/analytics';
import { ROUTES } from '@/lib/routes';
import { OAuthButtons } from '@/app/(auth)/components/oauth-buttons';

interface SignupFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function PasswordFields({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: Pick<SignupFormProps, 'password' | 'setPassword' | 'confirmPassword' | 'setConfirmPassword'>) {
  const t = useTranslations('auth');
  return (
    <>
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
          minLength={PASSWORD_MIN_LENGTH}
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
    </>
  );
}

function SignupForm(props: SignupFormProps) {
  const t = useTranslations('auth');
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      {props.error !== '' && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {props.error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">{t('name')}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t('namePlaceholder')}
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
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
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <PasswordFields
        password={props.password}
        setPassword={props.setPassword}
        confirmPassword={props.confirmPassword}
        setConfirmPassword={props.setConfirmPassword}
      />
      <Button type="submit" className="w-full" disabled={props.loading}>
        {props.loading ? t('creatingAccount') : t('createAccountButton')}
      </Button>
    </form>
  );
}

function validateSignupForm(
  password: string,
  confirmPassword: string,
  t: ReturnType<typeof useTranslations<'auth'>>,
): string | null {
  if (password !== confirmPassword) {
    return t('passwordsDoNotMatch');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return t('passwordMinLength');
  }
  return null;
}

function useSignupState() {
  const t = useTranslations('auth');
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
    const validationError = validateSignupForm(password, confirmPassword, t);
    if (validationError !== null) {
      setError(validationError);
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
    router.push(ROUTES.verifyEmail);
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    loading,
    handleSubmit,
  };
}

export default function SignupPage(): React.ReactNode {
  const t = useTranslations('auth');
  const state = useSignupState();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('createAccount')}</CardTitle>
        <CardDescription>{t('getStartedFree')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm
          name={state.name}
          setName={state.setName}
          email={state.email}
          setEmail={state.setEmail}
          password={state.password}
          setPassword={state.setPassword}
          confirmPassword={state.confirmPassword}
          setConfirmPassword={state.setConfirmPassword}
          error={state.error}
          loading={state.loading}
          onSubmit={(e) => void state.handleSubmit(e)}
        />
        <OAuthButtons callbackUrl={ROUTES.dashboard} />
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
