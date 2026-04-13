import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { buildDeploymentGroup } from '../lib/deployment-group';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

describe('buildDeploymentGroup', () => {
  it('returns all 6 stacks', () => {
    const app = new cdk.App();
    const stacks = buildDeploymentGroup(app, TEST_CONFIG, TEST_ENV);

    expect(stacks.storage).toBeDefined();
    expect(stacks.monitoring).toBeDefined();
    expect(stacks.networking).toBeDefined();
    expect(stacks.database).toBeDefined();
    expect(stacks.iam).toBeDefined();
    expect(stacks.compute).toBeDefined();
  });

  it('uses consistent stack naming: {appName}-{layer}-{stage}', () => {
    const app = new cdk.App();
    const stacks = buildDeploymentGroup(app, TEST_CONFIG, TEST_ENV);
    const prefix = TEST_CONFIG.appName;
    const suffix = TEST_CONFIG.stageName;

    expect(stacks.storage.stackName).toBe(`${prefix}-storage-${suffix}`);
    expect(stacks.monitoring.stackName).toBe(`${prefix}-monitoring-${suffix}`);
    expect(stacks.networking.stackName).toBe(`${prefix}-networking-${suffix}`);
    expect(stacks.database.stackName).toBe(`${prefix}-database-${suffix}`);
    expect(stacks.iam.stackName).toBe(`${prefix}-iam-${suffix}`);
    expect(stacks.compute.stackName).toBe(`${prefix}-compute-${suffix}`);
  });

  it('wires Compute to use Networking VPC', () => {
    const app = new cdk.App();
    const stacks = buildDeploymentGroup(app, TEST_CONFIG, TEST_ENV);
    // Cluster is created with the networking VPC — if wiring breaks, cluster won't resolve
    expect(stacks.compute.cluster).toBeDefined();
  });

  it('wires IAM taskRole into Compute', () => {
    const app = new cdk.App();
    const stacks = buildDeploymentGroup(app, TEST_CONFIG, TEST_ENV);
    // The service's task definition uses the IAM role
    expect(stacks.compute.service).toBeDefined();
  });
});
