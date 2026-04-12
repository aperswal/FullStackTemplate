'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/lib/payments/checkout';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
}

export function CheckoutButton({ priceId, planName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      await createCheckoutSession(priceId);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCheckout} className="w-full" disabled={loading}>
      {loading ? 'Redirecting...' : `Subscribe to ${planName}`}
    </Button>
  );
}
