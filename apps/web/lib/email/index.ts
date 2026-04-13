import { smtpProvider } from './providers/smtp';
import { resendProvider } from './providers/resend';
import type { EmailProvider, EmailOptions } from './provider';

import { env } from '@/lib/env';

export type { EmailOptions } from './provider';
export type { EmailProvider } from './provider';

function getEmailProvider(): EmailProvider {
  return env.DEPLOY_TARGET === 'docker' ? smtpProvider : resendProvider;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = getEmailProvider();
  await provider.send(options);
}
