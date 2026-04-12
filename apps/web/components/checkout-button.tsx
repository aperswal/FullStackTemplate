'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/payments/checkout';
import { trackEvent } from '@/lib/analytics';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
}

export function CheckoutButton({ priceId, planName }: CheckoutButtonProps) {
  const t = useTranslations('pricing');
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    trackEvent('checkout_initiated', { planName });
    try {
      await createCheckoutSession(priceId);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCheckout} className="w-full" disabled={loading}>
      {loading ? t('redirecting') : t('subscribeTo', { planName })}
    </Button>
  );
}
