'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/client';
import { ROUTES } from '@/lib/routes';

export function SignOutButton(): React.ReactNode {
  const t = useTranslations('nav');
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.login);
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
      {t('signOut')}
    </Button>
  );
}
