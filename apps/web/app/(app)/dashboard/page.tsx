import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/routes';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(ROUTES.login);
  }

  const t = await getTranslations('dashboard');
  const { user } = session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcomeBack', { name: user.name })}
        </h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('role')}</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={user.role === 'pro' ? 'default' : 'secondary'}>{user.role}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {user.role === 'free'
                ? t('upgradeToProForFullAccess')
                : user.role === 'pro'
                  ? t('youHaveFullAccess')
                  : t('administratorAccess')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('emailLabel')}</CardDescription>
            <CardTitle className="text-base">{user.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {user.emailVerified ? t('verified') : t('notVerified')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('memberSince')}</CardDescription>
            <CardTitle className="text-base">
              {new Date(user.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('accountCreated')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
