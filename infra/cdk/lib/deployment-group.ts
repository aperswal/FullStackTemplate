import * as cdk from 'aws-cdk-lib';
import type { EnvironmentConfig } from '../config';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkingStack } from './networking-stack';
import { DatabaseStack } from './database-stack';
import { IamStack } from './iam-stack';
import { ComputeStack } from './compute-stack';

export interface DeploymentGroupStacks {
  storage: StorageStack;
  monitoring: MonitoringStack;
  networking: NetworkingStack;
  database: DatabaseStack;
  iam: IamStack;
  compute: ComputeStack;
}

/**
 * Builds the full deployment: all 6 stacks wired together with correct
 * dependency ordering. Used by both bin/app.ts and tests so the wiring
 * logic is never duplicated.
 */
export function buildDeploymentGroup(
  app: cdk.App,
  config: EnvironmentConfig,
  env: cdk.Environment,
): DeploymentGroupStacks {
  const prefix = config.appName;
  const suffix = config.stageName;

  const storage = new StorageStack(app, `${prefix}-storage-${suffix}`, { env, config });

  const monitoring = new MonitoringStack(app, `${prefix}-monitoring-${suffix}`, { env, config });

  const networking = new NetworkingStack(app, `${prefix}-networking-${suffix}`, { env, config });

  const database = new DatabaseStack(app, `${prefix}-database-${suffix}`, {
    env,
    config,
    vpc: networking.vpc,
  });

  const iam = new IamStack(app, `${prefix}-iam-${suffix}`, {
    env,
    config,
    uploadPolicy: storage.uploadPolicy,
    dbSecret: database.dbSecret,
    logGroup: monitoring.logGroup,
  });

  const compute = new ComputeStack(app, `${prefix}-compute-${suffix}`, {
    env,
    config,
    vpc: networking.vpc,
    dbSecret: database.dbSecret,
    dbSecurityGroup: database.dbSecurityGroup,
    taskRole: iam.taskRole,
    logGroup: monitoring.logGroup,
  });

  return { storage, monitoring, networking, database, iam, compute };
}
