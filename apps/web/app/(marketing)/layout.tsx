import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

async function MarketingHeader() {
  const t = await getTranslations('nav');
  const tc = await getTranslations('common');

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-foreground"
      >
        {tc('skipToContent')}
      </a>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4"
        >
          <Link href={ROUTES.home} className="text-lg font-semibold">
            {t('brandName')}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.pricing}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              {t('pricing')}
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              {t('login')}
            </Link>
            <Link
              href={ROUTES.signup}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              {t('getStarted')}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}

async function MarketingFooter() {
  const tf = await getTranslations('footer');

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>{tf('copyright', { year: new Date().getFullYear() })}</p>
        <div className="flex gap-4">
          <Link href={ROUTES.pricing} className="hover:text-foreground">
            {tf('pricing')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
