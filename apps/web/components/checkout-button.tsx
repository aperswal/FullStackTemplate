'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/payments/checkout';
import { trackEvent } from '@/lib/analytics';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
}

export function CheckoutButton({ priceId, planName }: CheckoutButtonProps): React.ReactNode {
  const t = useTranslations('pricing');
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    trackEvent('checkout_initiated', { planName });
    try {
      await createCheckoutSession(priceId);
    } catch {
      toast.error(t('checkoutFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={() => void handleCheckout()} className="w-full" disabled={loading}>
      {loading ? t('redirecting') : t('subscribeTo', { planName })}
    </Button>
  );
}
