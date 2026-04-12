import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-muted-foreground text-6xl font-bold">404</span>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: 'default' })}>
        Back to home
      </Link>
    </div>
  );
}
