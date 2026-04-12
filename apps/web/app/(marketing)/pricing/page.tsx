import { PLANS } from '@template/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/checkout-button';

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for everyone.',
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Simple, transparent pricing. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {Object.entries(PLANS).map(([key, plan]) => (
          <Card key={key} className={key === 'pro' ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {key === 'pro' && <Badge>Popular</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
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
                  <CheckoutButton priceId={plan.externalPriceId} planName={plan.name} />
                ) : (
                  <a
                    href="/signup"
                    className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-sm font-medium hover:bg-muted"
                  >
                    Get started free
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
