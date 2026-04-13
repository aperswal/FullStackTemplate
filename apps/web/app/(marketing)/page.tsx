import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createMetadata } from '@/lib/seo/metadata';
import { JsonLdScript, organizationJsonLd, webSiteJsonLd } from '@/lib/seo/json-ld';
import { ROUTES } from '@/lib/routes';
import messages from '@/messages/en.json';

export const metadata = createMetadata({
  title: 'Home',
  description: messages.seo.defaultDescription,
  path: ROUTES.home,
});

type MarketingTranslations = Awaited<ReturnType<typeof getTranslations<'marketing'>>>;

const FEATURE_KEYS = ['auth', 'payments', 'email', 'database', 'analytics', 'seo'] as const;

function HeroSection({ t }: { t: MarketingTranslations }) {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t('heroTitle')}
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{t('heroDescription')}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href={ROUTES.signup} className={cn(buttonVariants({ size: 'lg' }))}>
          {t('getStarted')}
        </Link>
        <Link
          href={ROUTES.pricing}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          {t('viewPricing')}
        </Link>
      </div>
    </section>
  );
}

function FeaturesSection({ t }: { t: MarketingTranslations }) {
  return (
    <section className="border-t bg-muted/40 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t('featuresTitle')}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          {t('featuresSubtitle')}
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => (
            <div key={key} className="rounded-lg border bg-background p-6">
              <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ t }: { t: MarketingTranslations }) {
  return (
    <section className="py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t('ctaTitle')}</h2>
        <p className="mt-4 text-muted-foreground">{t('ctaDescription')}</p>
        <Link href={ROUTES.signup} className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
          {t('ctaButton')}
        </Link>
      </div>
    </section>
  );
}

export default async function HomePage(): Promise<React.ReactNode> {
  const t = await getTranslations('marketing');
  const appName = messages.common.appName;

  return (
    <>
      <JsonLdScript data={organizationJsonLd({ name: appName })} />
      <JsonLdScript data={webSiteJsonLd({ name: appName })} />
      <HeroSection t={t} />
      <FeaturesSection t={t} />
      <CtaSection t={t} />
    </>
  );
}
