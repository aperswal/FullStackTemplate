'use client';

import { Suspense, type ReactNode } from 'react';

import { QueryProvider } from './query-provider';
import { AnalyticsProvider } from './analytics-provider';

interface ProvidersProps {
  children: ReactNode;
  posthogKey?: string;
  posthogHost?: string;
}

export function Providers({ children, posthogKey, posthogHost }: ProvidersProps): ReactNode {
  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <AnalyticsProvider posthogKey={posthogKey} posthogHost={posthogHost}>
          {children}
        </AnalyticsProvider>
      </Suspense>
    </QueryProvider>
  );
}
