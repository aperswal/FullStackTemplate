import nodemailer from 'nodemailer';

import { env } from '@/lib/env';
import { ExternalServiceError } from '@/lib/errors';
import type { EmailOptions, EmailProvider } from '../provider';

let transporter: nodemailer.Transporter | null = null;

const DEFAULT_SMTP_PORT = 1025;
const SMTPS_PORT = 465;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = env.SMTP_PORT ?? DEFAULT_SMTP_PORT;
    const auth =
      env.SMTP_USER !== undefined &&
      env.SMTP_USER !== '' &&
      env.SMTP_PASSWORD !== undefined &&
      env.SMTP_PASSWORD !== ''
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST ?? 'localhost',
      port,
      secure: port === SMTPS_PORT,
      ...(auth ? { auth } : {}),
    });
  }
  return transporter;
}

export const smtpProvider: EmailProvider = {
  async send(options: EmailOptions): Promise<void> {
    const transport = getTransporter();
    const from = options.from ?? env.EMAIL_FROM;

    try {
      await transport.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      throw new ExternalServiceError(`SMTP failed to send "${options.subject}" to ${options.to}`, {
        cause: error,
      });
    }
  },
};
