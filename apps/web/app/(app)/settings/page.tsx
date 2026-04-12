import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/lib/payments/checkout';
import { ROUTES } from '@/lib/routes';
import messages from '@/messages/en.json';

export const metadata = {
  title: messages.settings.title,
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(ROUTES.login);

  const t = await getTranslations('settings');
  const { user } = session;
  const role = (user.role as string) ?? 'free';
  const hasPaymentCustomer = !!(user.paymentCustomerId as string | null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
          <CardDescription>{t('yourAccountInfo')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('nameLabel')}</span>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('emailLabel')}</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('roleLabel')}</span>
            <Badge variant={role === 'free' ? 'secondary' : 'default'}>{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('billing')}</CardTitle>
          <CardDescription>{t('billingDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPaymentCustomer ? (
            <form action={createPortalSession}>
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
    </div>
  );
}
