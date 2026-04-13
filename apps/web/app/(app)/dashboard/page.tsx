import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/routes';
import { createMetadata } from '@/lib/seo/metadata';

export const metadata = createMetadata({
  title: 'Dashboard',
  description: 'Manage your account and subscription.',
  path: ROUTES.dashboard,
  noIndex: true,
});

type DashboardTranslations = Awaited<ReturnType<typeof getTranslations<'dashboard'>>>;

function roleDescription(role: string, t: DashboardTranslations) {
  if (role === 'free') {
    return t('upgradeToProForFullAccess');
  }
  if (role === 'pro') {
    return t('youHaveFullAccess');
  }
  return t('administratorAccess');
}

interface DashboardCardProps {
  user: { role: string; email: string; emailVerified: boolean; createdAt: Date };
  t: DashboardTranslations;
}

function DashboardCards({ user, t }: DashboardCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>{t('role')}</CardDescription>
          <CardTitle className="flex items-center gap-2">
            <Badge variant={user.role === 'pro' ? 'default' : 'secondary'}>{user.role}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{roleDescription(user.role, t)}</p>
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
  );
}

export default async function DashboardPage(): Promise<React.ReactNode> {
  const session = await auth.api.getSession({ headers: await headers() });
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

      <DashboardCards user={user} t={t} />
    </div>
  );
}
