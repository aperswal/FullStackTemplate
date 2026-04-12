import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Role</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={user.role === 'pro' ? 'default' : 'secondary'}>{user.role}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {user.role === 'free'
                ? 'Upgrade to Pro for full access'
                : user.role === 'pro'
                  ? 'You have full access'
                  : 'Administrator access'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Email</CardDescription>
            <CardTitle className="text-base">{user.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {user.emailVerified ? 'Verified' : 'Not verified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Member since</CardDescription>
            <CardTitle className="text-base">
              {new Date(user.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Account created</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
