import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/lib/payments/checkout';
import { getProfile } from '@/features/profile/queries';
import { ProfileForm } from '@/features/profile/components';
import { ROUTES } from '@/lib/routes';
import messages from '@/messages/en.json';

type SettingsTranslations = Awaited<ReturnType<typeof getTranslations<'settings'>>>;

export const metadata = {
  title: messages.settings.title,
};

interface ProfileCardProps {
  profile: { email: string; name: string; image: string | null; role: string | null };
  t: SettingsTranslations;
}

function ProfileCard({ profile, t }: ProfileCardProps) {
  const role = profile.role ?? 'free';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile')}</CardTitle>
        <CardDescription>{t('yourAccountInfo')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('emailLabel')}</span>
          <span className="text-sm font-medium">{profile.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('roleLabel')}</span>
          <Badge variant={role === 'free' ? 'secondary' : 'default'}>{role}</Badge>
        </div>
        <ProfileForm defaultValues={{ name: profile.name, image: profile.image }} />
      </CardContent>
    </Card>
  );
}

interface BillingCardProps {
  hasPaymentCustomer: boolean;
  t: SettingsTranslations;
}

function BillingCard({ hasPaymentCustomer, t }: BillingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('billing')}</CardTitle>
        <CardDescription>{t('billingDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasPaymentCustomer ? (
          <form
            action={async () => {
              'use server';
              await createPortalSession(undefined);
            }}
          >
            <Button type="submit" variant="outline">
              {t('manageSubscription')}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('noSubscription')}{' '}
            <a href={ROUTES.pricing} className="text-primary hover:underline">
              {t('viewPlans')}
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage(): Promise<React.ReactNode> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(ROUTES.login);
  }

  const t = await getTranslations('settings');
  const profile = await getProfile(session.user.id);
  if (profile === null) {
    redirect(ROUTES.login);
  }

  const hasPaymentCustomer = Boolean(session.user.paymentCustomerId as string | null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <ProfileCard profile={profile} t={t} />
      <BillingCard hasPaymentCustomer={hasPaymentCustomer} t={t} />
    </div>
  );
}
