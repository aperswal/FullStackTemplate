import { PLANS } from '@template/shared';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/checkout-button';
import { ROUTES } from '@/lib/routes';
import { getPriceIdForPlan } from '@/lib/payments/plan-mapping';
import { createMetadata } from '@/lib/seo/metadata';
import { JsonLdScript, webPageJsonLd } from '@/lib/seo/json-ld';
import { env } from '@/lib/env';
import messages from '@/messages/en.json';

export const metadata = createMetadata({
  title: messages.pricing.title,
  description: messages.pricing.description,
  path: ROUTES.pricing,
});

type PricingTranslations = Awaited<ReturnType<typeof getTranslations<'pricing'>>>;
type PlanTranslations = Awaited<ReturnType<typeof getTranslations<'plans'>>>;

interface PlanCardProps {
  planKey: string;
  price: number;
  features: string[];
  priceId: string | undefined;
  t: PricingTranslations;
  tp: PlanTranslations;
}

function PlanCard({ planKey, price, features, priceId, t, tp }: PlanCardProps) {
  return (
    <Card className={planKey === 'pro' ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{tp(`${planKey}.name`)}</CardTitle>
          {planKey === 'pro' && <Badge>{t('popular')}</Badge>}
        </div>
        <CardDescription>{tp(`${planKey}.description`)}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">${price}</span>
          {price > 0 && <span className="text-muted-foreground">{t('perMonth')}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature: string) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <svg
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
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
          {priceId !== undefined && priceId !== '' ? (
            <CheckoutButton priceId={priceId} planName={tp(`${planKey}.name`)} />
          ) : (
            <Link
              href={ROUTES.signup}
              className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-sm font-medium hover:bg-muted"
            >
              {t('getStartedFree')}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PricingPage(): Promise<React.ReactNode> {
  const t = await getTranslations('pricing');
  const tp = await getTranslations('plans');

  return (
    <>
      <JsonLdScript
        data={webPageJsonLd({
          name: messages.pricing.title,
          description: messages.pricing.description,
          url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.pricing}`,
        })}
      />
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              price={plan.price}
              features={messages.plans[key as keyof typeof messages.plans]?.features ?? []}
              priceId={getPriceIdForPlan(key) ?? undefined}
              t={t}
              tp={tp}
            />
          ))}
        </div>
      </div>
    </>
  );
}
