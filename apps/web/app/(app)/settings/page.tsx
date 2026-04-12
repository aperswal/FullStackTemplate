import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/lib/payments/checkout';

export const metadata = {
  title: 'Settings',
  description: 'Manage your account settings.',
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const { user } = session;
  const role = (user.role as string) ?? 'free';
  const hasPaymentCustomer = !!(user.paymentCustomerId as string | null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant={role === 'free' ? 'secondary' : 'default'}>{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription and payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPaymentCustomer ? (
            <form action={createPortalSession}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active subscription.{' '}
              <a href="/pricing" className="text-primary hover:underline">
                View plans
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
