import type { AppSpec } from './types';

export const spec: AppSpec = {
  info: {
    title: 'FullStack Template API',
    version: '1.0.0',
    baseUrl: 'http://localhost:3000',
  },

  endpoints: [
    // ─── Health ──────────────────────────────────────────────────
    {
      path: '/api/health',
      method: 'GET',
      auth: false,
      description: 'Database connectivity health check',
      response: { status: 'string ("healthy" | "unhealthy")', timestamp: 'string (ISO 8601)' },
    },

    // ─── Auth (BetterAuth) ───────────────────────────────────────
    {
      path: '/api/auth/sign-up/email',
      method: 'POST',
      auth: false,
      description: 'Create a new account with email and password',
      request: { name: 'string', email: 'string', password: 'string (min 8 chars)' },
      response: { user: 'User', session: 'Session' },
    },
    {
      path: '/api/auth/sign-in/email',
      method: 'POST',
      auth: false,
      description: 'Sign in with email and password',
      request: { email: 'string', password: 'string' },
      response: { user: 'User', session: 'Session' },
    },
    {
      path: '/api/auth/sign-out',
      method: 'POST',
      auth: true,
      description: 'Sign out and invalidate the current session',
      response: { success: 'boolean' },
    },
    {
      path: '/api/auth/get-session',
      method: 'GET',
      auth: true,
      description: 'Get the current user session',
      response: { user: 'User', session: 'Session' },
    },
    {
      path: '/api/auth/verify-email',
      method: 'GET',
      auth: false,
      description: 'Verify email address using token from verification email',
      request: { token: 'string (query param)' },
    },
    {
      path: '/api/auth/forgot-password',
      method: 'POST',
      auth: false,
      description: 'Send password reset email',
      request: { email: 'string' },
    },
    {
      path: '/api/auth/reset-password',
      method: 'POST',
      auth: false,
      description: 'Reset password using token from reset email',
      request: { token: 'string', newPassword: 'string' },
    },
    {
      path: '/api/auth/callback/github',
      method: 'GET',
      auth: false,
      description: 'GitHub OAuth callback (only active if GITHUB_CLIENT_ID is set)',
    },
    {
      path: '/api/auth/callback/google',
      method: 'GET',
      auth: false,
      description: 'Google OAuth callback (only active if GOOGLE_CLIENT_ID is set)',
    },

    // ─── Stripe Webhook ─────────────────────────────────────────
    {
      path: '/api/webhooks/stripe',
      method: 'POST',
      auth: false,
      description:
        'Stripe webhook receiver. Requires stripe-signature header for HMAC verification.',
      headers: { 'stripe-signature': 'string (required)' },
      request: { body: 'Stripe event payload (raw)' },
      response: { received: 'boolean' },
    },

    // ─── OG Image ────────────────────────────────────────────────
    {
      path: '/api/og',
      method: 'GET',
      auth: false,
      description: 'Dynamic Open Graph image generator for social sharing',
      request: { title: 'string (query param, optional)' },
      response: { body: 'image/png' },
    },
  ],

  routes: [
    {
      path: '/',
      group: 'marketing',
      auth: false,
      description: 'Homepage with hero, features, and call-to-action',
    },
    {
      path: '/pricing',
      group: 'marketing',
      auth: false,
      description: 'Pricing page with Free and Pro plan cards',
    },
    {
      path: '/login',
      group: 'auth',
      auth: false,
      description: 'Email/password and OAuth sign-in form',
    },
    { path: '/signup', group: 'auth', auth: false, description: 'Account registration form' },
    {
      path: '/verify-email',
      group: 'auth',
      auth: false,
      description: 'Email verification status page',
    },
    { path: '/reset-password', group: 'auth', auth: false, description: 'Password reset form' },
    {
      path: '/dashboard',
      group: 'app',
      auth: true,
      description: 'User dashboard showing account info and subscription status',
    },
    {
      path: '/settings',
      group: 'app',
      auth: true,
      description: 'Account settings and billing management',
    },
  ],

  schemas: [
    {
      table: 'user',
      columns: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'email', type: 'text', nullable: false },
        { name: 'email_verified', type: 'boolean', nullable: false, defaultValue: 'false' },
        { name: 'image', type: 'text', nullable: true },
        {
          name: 'role',
          type: 'user_role (free | pro | admin)',
          nullable: false,
          defaultValue: 'free',
        },
        { name: 'payment_customer_id', type: 'text', nullable: true },
        { name: 'payment_provider', type: 'text', nullable: true, defaultValue: 'stripe' },
        { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
      ],
      uniqueConstraints: ['email'],
    },
    {
      table: 'session',
      columns: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'expires_at', type: 'timestamp', nullable: false },
        { name: 'token', type: 'text', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'ip_address', type: 'text', nullable: true },
        { name: 'user_agent', type: 'text', nullable: true },
        { name: 'user_id', type: 'text', nullable: false },
      ],
      foreignKeys: [{ column: 'user_id', references: 'user.id' }],
      uniqueConstraints: ['token'],
    },
    {
      table: 'account',
      columns: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'account_id', type: 'text', nullable: false },
        { name: 'provider_id', type: 'text', nullable: false },
        { name: 'user_id', type: 'text', nullable: false },
        { name: 'access_token', type: 'text', nullable: true },
        { name: 'refresh_token', type: 'text', nullable: true },
        { name: 'id_token', type: 'text', nullable: true },
        { name: 'access_token_expires_at', type: 'timestamp', nullable: true },
        { name: 'refresh_token_expires_at', type: 'timestamp', nullable: true },
        { name: 'scope', type: 'text', nullable: true },
        { name: 'password', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
      ],
      foreignKeys: [{ column: 'user_id', references: 'user.id' }],
    },
    {
      table: 'verification',
      columns: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'identifier', type: 'text', nullable: false },
        { name: 'value', type: 'text', nullable: false },
        { name: 'expires_at', type: 'timestamp', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
      ],
    },
    {
      table: 'subscription',
      columns: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'user_id', type: 'text', nullable: false },
        { name: 'provider', type: 'text', nullable: false, defaultValue: 'stripe' },
        { name: 'external_subscription_id', type: 'text', nullable: false },
        { name: 'external_price_id', type: 'text', nullable: false },
        {
          name: 'status',
          type: 'subscription_status (active | canceled | past_due | trialing)',
          nullable: false,
          defaultValue: 'active',
        },
        { name: 'current_period_start', type: 'timestamp', nullable: false },
        { name: 'current_period_end', type: 'timestamp', nullable: false },
        { name: 'cancel_at_period_end', type: 'boolean', nullable: false, defaultValue: 'false' },
        { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
      ],
      foreignKeys: [{ column: 'user_id', references: 'user.id' }],
      uniqueConstraints: ['external_subscription_id', 'user_id + provider'],
    },
  ],
};
