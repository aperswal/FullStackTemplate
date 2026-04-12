import nodemailer from 'nodemailer';

import type { EmailOptions, EmailProvider } from '../provider';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
    });
  }
  return transporter;
}

export const smtpProvider: EmailProvider = {
  async send(options: EmailOptions): Promise<void> {
    const transport = getTransporter();
    const from = options.from ?? process.env.EMAIL_FROM ?? 'noreply@example.com';

    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  },
};
