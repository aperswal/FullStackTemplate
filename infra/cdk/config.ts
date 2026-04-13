interface EnvironmentConfig {
  account: string;
  region: string;
  appName: string;
  stageName: string;
  logRetentionDays: number;
  alarmEmail?: string;
  appUrl: string;

  // Networking
  vpcCidr: string;

  // Database
  dbMultiAz: boolean;
  dbInstanceClass: string;

  // Compute
  desiredTaskCount: number;
  cpu: number;
  memory: number;
  dockerImage?: string;

  // CI/CD OIDC
  githubOrg?: string;
  githubRepo?: string;
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
    appUrl: process.env.APP_URL ?? 'https://localhost:3000',
    vpcCidr: '10.0.0.0/16',
    dbMultiAz: false,
    dbInstanceClass: 't4g.micro',
    desiredTaskCount: 1,
    cpu: 256,
    memory: 512,
    githubOrg: process.env.GITHUB_ORG,
    githubRepo: process.env.GITHUB_REPO,
  },
  staging: {
    ...baseConfig,
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    stageName: 'staging',
    logRetentionDays: 30,
    appUrl: process.env.APP_URL ?? 'https://localhost:3000',
    vpcCidr: '10.1.0.0/16',
    dbMultiAz: false,
    dbInstanceClass: 't4g.small',
    desiredTaskCount: 1,
    cpu: 512,
    memory: 1024,
    githubOrg: process.env.GITHUB_ORG,
    githubRepo: process.env.GITHUB_REPO,
  },
  production: {
    ...baseConfig,
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
    stageName: 'production',
    logRetentionDays: 90,
    alarmEmail: process.env.ALARM_EMAIL,
    appUrl: process.env.APP_URL ?? 'https://localhost:3000',
    vpcCidr: '10.2.0.0/16',
    dbMultiAz: true,
    dbInstanceClass: 't4g.medium',
    desiredTaskCount: 2,
    cpu: 1024,
    memory: 2048,
    githubOrg: process.env.GITHUB_ORG,
    githubRepo: process.env.GITHUB_REPO,
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

export function requireAccount(config: EnvironmentConfig): void {
  if (config.account === '') {
    throw new Error(
      `CDK_DEFAULT_ACCOUNT must be set for stage "${config.stageName}". ` +
        'Set it via the CDK_DEFAULT_ACCOUNT environment variable.',
    );
  }
}

export type { EnvironmentConfig };
