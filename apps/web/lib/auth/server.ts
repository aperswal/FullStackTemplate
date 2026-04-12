import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { render } from '@react-email/components';

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';
import { VerificationEmail } from '@/lib/email/templates/verification';
import { PasswordResetEmail } from '@/lib/email/templates/password-reset';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const html = await render(PasswordResetEmail({ resetUrl: url, userName: user.name }));
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const html = await render(VerificationEmail({ verificationUrl: url, userName: user.name }));
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html,
      });
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'free',
        input: false,
      },
      paymentCustomerId: {
        type: 'string',
        required: false,
        input: false,
      },
      paymentProvider: {
        type: 'string',
        required: false,
        defaultValue: 'stripe',
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
