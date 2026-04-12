interface EnvironmentConfig {
  account: string;
  region: string;
  appName: string;
  stageName: string;
  logRetentionDays: number;
  alarmEmail?: string;
}

const baseConfig = {
  appName: 'fullstack-template',
};

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    ...baseConfig,
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    stageName: 'dev',
    logRetentionDays: 7,
  },
  staging: {
    ...baseConfig,
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    stageName: 'staging',
    logRetentionDays: 30,
  },
  production: {
    ...baseConfig,
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    stageName: 'production',
    logRetentionDays: 90,
    alarmEmail: process.env.ALARM_EMAIL,
  },
};

export function getConfig(stage?: string): EnvironmentConfig {
  const stageName = stage ?? process.env.STAGE ?? 'dev';
  const config = environments[stageName];
  if (!config) {
    throw new Error(
      `Unknown stage: ${stageName}. Valid stages: ${Object.keys(environments).join(', ')}`,
    );
  }
  return config;
}

export type { EnvironmentConfig };
