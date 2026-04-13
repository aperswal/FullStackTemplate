import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { render } from '@react-email/components';

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';
import { env } from '@/lib/env';
import { VerificationEmail } from '@/lib/email/templates/verification';
import { PasswordResetEmail } from '@/lib/email/templates/password-reset';

const SESSION_CACHE_MAX_AGE_SECONDS = 300;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustHost: true,

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
    ...(env.GOOGLE_CLIENT_ID !== undefined &&
    env.GOOGLE_CLIENT_ID !== '' &&
    env.GOOGLE_CLIENT_SECRET !== undefined &&
    env.GOOGLE_CLIENT_SECRET !== ''
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID !== undefined &&
    env.GITHUB_CLIENT_ID !== '' &&
    env.GITHUB_CLIENT_SECRET !== undefined &&
    env.GITHUB_CLIENT_SECRET !== ''
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: SESSION_CACHE_MAX_AGE_SECONDS,
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
