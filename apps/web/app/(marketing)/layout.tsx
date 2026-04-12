import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold">
            Template
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Pricing
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Log in
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>&copy; {new Date().getFullYear()} Template. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
