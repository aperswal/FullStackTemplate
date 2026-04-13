'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/lib/auth/client';
import { trackEvent } from '@/lib/analytics';

interface OAuthButtonsProps {
  callbackUrl: string;
}

export function OAuthButtons({ callbackUrl }: OAuthButtonsProps): React.ReactNode {
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  async function handleOAuth(provider: 'google' | 'github') {
    trackEvent('auth_oauth_initiated', { provider });
    await signIn.social({ provider, callbackURL: callbackUrl });
  }

  return (
    <>
      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">{tc('or')}</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={() => void handleOAuth('google')}>
          {t('continueWithGoogle')}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => void handleOAuth('github')}>
          {t('continueWithGitHub')}
        </Button>
      </div>
    </>
  );
}
