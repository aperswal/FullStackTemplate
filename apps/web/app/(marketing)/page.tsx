import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createMetadata } from '@/lib/seo/metadata';
import { JsonLdScript, organizationJsonLd, webSiteJsonLd } from '@/lib/seo/json-ld';

export const metadata = createMetadata({
  title: 'Home',
  description:
    'A production-ready full-stack template with authentication, payments, email, and more.',
  path: '/',
});

const FEATURES = [
  {
    title: 'Authentication',
    description: 'Email/password, OAuth, email verification, and role-based access out of the box.',
  },
  {
    title: 'Payments',
    description: 'Stripe integration with subscription management and webhook handling.',
  },
  {
    title: 'Email',
    description: 'Transactional email with Resend and React Email templates, with SMTP fallback.',
  },
  {
    title: 'Database',
    description: 'PostgreSQL with Drizzle ORM, type-safe queries, and migration tooling.',
  },
  {
    title: 'Analytics',
    description: 'Privacy-respecting analytics with PostHog and cookie consent built in.',
  },
  {
    title: 'SEO',
    description:
      'Sitemap, robots.txt, Open Graph images, JSON-LD structured data, and metadata factory.',
  },
] as const;

export default function HomePage() {
  return (
    <>
      <JsonLdScript data={organizationJsonLd({ name: 'FullStack Template' })} />
      <JsonLdScript data={webSiteJsonLd({ name: 'FullStack Template' })} />

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Ship faster with a production-ready template
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Authentication, payments, email, database, analytics, and SEO pre-wired so you can focus
          on what makes your product unique.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>
            Get started
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            View pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to launch
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Stop rebuilding the same infrastructure. Start building your product.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-background p-6">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to start building?</h2>
          <p className="mt-4 text-muted-foreground">
            Create your account and launch your first project in minutes.
          </p>
          <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
            Get started for free
          </Link>
        </div>
      </section>
    </>
  );
}
