import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('nav');
  const tf = await getTranslations('footer');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
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

      <main className="flex-1">{children}</main>

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
    </div>
  );
}
