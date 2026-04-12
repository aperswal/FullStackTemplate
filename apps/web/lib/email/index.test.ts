import { describe, it, expect, vi, beforeEach } from 'vitest';

import { sendEmail } from './index';
import { smtpProvider } from './providers/smtp';
import { resendProvider } from './providers/resend';

vi.mock('./providers/smtp', () => ({
  smtpProvider: { send: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('./providers/resend', () => ({
  resendProvider: { send: vi.fn().mockResolvedValue(undefined) },
}));

const emailOptions = {
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>',
};

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEPLOY_TARGET;
  });

  it('calls smtpProvider when DEPLOY_TARGET is "docker"', async () => {
    process.env.DEPLOY_TARGET = 'docker';
    await sendEmail(emailOptions);
    expect(smtpProvider.send).toHaveBeenCalledWith(emailOptions);
    expect(resendProvider.send).not.toHaveBeenCalled();
  });

  it('calls resendProvider when DEPLOY_TARGET is not "docker"', async () => {
    process.env.DEPLOY_TARGET = 'vercel';
    await sendEmail(emailOptions);
    expect(resendProvider.send).toHaveBeenCalledWith(emailOptions);
    expect(smtpProvider.send).not.toHaveBeenCalled();
  });

  it('defaults to docker when DEPLOY_TARGET is not set', async () => {
    await sendEmail(emailOptions);
    expect(smtpProvider.send).toHaveBeenCalledWith(emailOptions);
    expect(resendProvider.send).not.toHaveBeenCalled();
  });

  it('passes email options to the provider', async () => {
    process.env.DEPLOY_TARGET = 'vercel';
    const options = {
      to: 'admin@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      from: 'noreply@example.com',
    };
    await sendEmail(options);
    expect(resendProvider.send).toHaveBeenCalledWith(options);
  });
});
