import { smtpProvider } from './providers/smtp';
import { resendProvider } from './providers/resend';
import type { EmailProvider, EmailOptions } from './provider';

export type { EmailOptions } from './provider';
export type { EmailProvider } from './provider';

function getEmailProvider(): EmailProvider {
  const deployTarget = process.env.DEPLOY_TARGET ?? 'docker';
  return deployTarget === 'docker' ? smtpProvider : resendProvider;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = getEmailProvider();
  await provider.send(options);
}
