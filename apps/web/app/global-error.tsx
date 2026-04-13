'use client';

import type { CSSProperties } from 'react';
import messages from '@/messages/en.json';

const containerStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  padding: '1rem',
  textAlign: 'center',
  fontFamily: 'system-ui, sans-serif',
};

const buttonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: '0.5rem',
  border: 'none',
  backgroundColor: '#18181b',
  color: '#fafafa',
  cursor: 'pointer',
};

function ErrorDisplay({ digest }: { digest?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{messages.errors.somethingWentWrong}</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '28rem' }}>
        {messages.errors.criticalError}
      </p>
      {digest !== undefined && digest !== '' && (
        <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Error ID: {digest}</p>
      )}
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  return (
    <html lang="en">
      <body>
        <div style={containerStyle}>
          <ErrorDisplay digest={error.digest} />
          <button onClick={reset} style={buttonStyle}>
            {messages.errors.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
