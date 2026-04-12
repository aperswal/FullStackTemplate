import { Resend } from 'resend';

import type { EmailOptions, EmailProvider } from '../provider';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is required when using Resend email provider');
    resend = new Resend(apiKey);
  }
  return resend;
}

export const resendProvider: EmailProvider = {
  async send(options: EmailOptions): Promise<void> {
    const client = getResend();
    const from = options.from ?? process.env.EMAIL_FROM ?? 'noreply@example.com';

    const { error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  },
};
