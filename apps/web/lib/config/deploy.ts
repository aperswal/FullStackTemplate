/**
 * Central deploy configuration — the single place that defines what DEPLOY_TARGET controls.
 * Every module that needs to behave differently in SaaS vs self-hosted mode imports from here.
 */

export type DeployTarget = 'vercel' | 'docker';

const deployTarget = (process.env.DEPLOY_TARGET ?? 'docker') as DeployTarget;

export const deployConfig = {
  target: deployTarget,
  isDocker: deployTarget === 'docker',
  isSaaS: deployTarget === 'vercel',
  emailProvider: deployTarget === 'docker' ? 'smtp' : 'resend',
  paymentProvider: 'stripe',
  analyticsEnabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  requireEmailVerification: true,
} as const;
