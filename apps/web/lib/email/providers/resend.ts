import { Resend } from 'resend';

import { env } from '@/lib/env';
import { ExternalServiceError, ServerError } from '@/lib/errors';
import type { EmailOptions, EmailProvider } from '../provider';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = env.RESEND_API_KEY;
    if (apiKey === undefined || apiKey === '') {
      throw new ServerError('RESEND_API_KEY is required when using Resend email provider');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export const resendProvider: EmailProvider = {
  async send(options: EmailOptions): Promise<void> {
    const client = getResend();
    const from = options.from ?? env.EMAIL_FROM;

    const { error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new ExternalServiceError(
        `Resend failed to send "${options.subject}" to ${options.to}`,
        { cause: error },
      );
    }
  },
};
