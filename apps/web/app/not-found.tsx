import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';
import messages from '@/messages/en.json';

const t = messages.errors;
const tc = messages.common;

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-muted-foreground text-6xl font-bold">{t.notFoundCode}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{t.pageNotFound}</h1>
        <p className="text-muted-foreground max-w-md text-sm">{t.pageNotFoundDescription}</p>
      </div>
      <Link href={ROUTES.home} className={buttonVariants({ variant: 'default' })}>
        {tc.backToHome}
      </Link>
    </div>
  );
}
