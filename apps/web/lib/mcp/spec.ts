import type { SiteSpec } from './types';

export const spec: SiteSpec = {
  site: {
    name: 'FullStack Template',
    description:
      'A production-ready full-stack template with authentication, payments, email, and more.',
    features: [
      'Email/password and OAuth authentication',
      'Stripe subscription billing (Free and Pro plans)',
      'User dashboard and account settings',
      'Email verification and password reset',
    ],
  },

  pages: [
    {
      path: '/',
      title: 'Home',
      description: 'Homepage with hero, features, and call-to-action',
      auth: false,
    },
    {
      path: '/pricing',
      title: 'Pricing',
      description: 'Pricing page with Free and Pro plan cards',
      auth: false,
    },
    {
      path: '/login',
      title: 'Sign In',
      description: 'Email/password and OAuth sign-in form',
      auth: false,
    },
    { path: '/signup', title: 'Sign Up', description: 'Account registration form', auth: false },
    {
      path: '/dashboard',
      title: 'Dashboard',
      description: 'User dashboard showing account info and subscription status',
      auth: true,
    },
    {
      path: '/settings',
      title: 'Settings',
      description: 'Account settings and billing management',
      auth: true,
    },
  ],

  actions: [
    // Public actions
    {
      name: 'sign_up',
      description: 'Create a new account with email and password',
      auth: false,
      method: 'POST',
      path: '/api/auth/sign-up/email',
      input: { name: 'string', email: 'string', password: 'string (min 8 chars)' },
    },
    {
      name: 'sign_in',
      description: 'Sign in with email and password',
      auth: false,
      method: 'POST',
      path: '/api/auth/sign-in/email',
      input: { email: 'string', password: 'string' },
    },
    {
      name: 'check_health',
      description: 'Check if the application is running and healthy',
      auth: false,
      method: 'GET',
      path: '/api/health',
    },

    // Authenticated actions
    {
      name: 'get_session',
      description: 'Get the current user session and profile',
      auth: true,
      method: 'GET',
      path: '/api/auth/get-session',
    },
    {
      name: 'sign_out',
      description: 'Sign out and invalidate the current session',
      auth: true,
      method: 'POST',
      path: '/api/auth/sign-out',
    },
  ],
};
