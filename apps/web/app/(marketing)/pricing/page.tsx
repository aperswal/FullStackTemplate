import { PLANS } from '@template/shared';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/checkout-button';
import { ROUTES } from '@/lib/routes';
import messages from '@/messages/en.json';

export const metadata = {
  title: messages.pricing.title,
  description: messages.pricing.description,
};

export default async function PricingPage() {
  const t = await getTranslations('pricing');
  const tp = await getTranslations('plans');

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {Object.entries(PLANS).map(([key, plan]) => {
          const features = messages.plans[key as keyof typeof messages.plans]?.features ?? [];

          return (
            <Card key={key} className={key === 'pro' ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{tp(`${key}.name`)}</CardTitle>
                  {key === 'pro' && <Badge>{t('popular')}</Badge>}
                </div>
                <CardDescription>{tp(`${key}.description`)}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-muted-foreground">{t('perMonth')}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 shrink-0 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.externalPriceId ? (
                    <CheckoutButton priceId={plan.externalPriceId} planName={tp(`${key}.name`)} />
                  ) : (
                    <a
                      href={ROUTES.signup}
                      className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-sm font-medium hover:bg-muted"
                    >
                      {t('getStartedFree')}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
