import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { StorageStack } from '../lib/storage-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { DatabaseStack } from '../lib/database-stack';
import { IamStack } from '../lib/iam-stack';
import { ComputeStack } from '../lib/compute-stack';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

describe('ComputeStack', () => {
  it('matches snapshot', () => {
    const app = new cdk.App();

    const storageStack = new StorageStack(app, 'TestStorageStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const networkingStack = new NetworkingStack(app, 'TestNetworkingStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const databaseStack = new DatabaseStack(app, 'TestDatabaseStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
      vpc: networkingStack.vpc,
    });

    const iamStack = new IamStack(app, 'TestIamStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
      uploadPolicy: storageStack.uploadPolicy,
      dbSecret: databaseStack.dbSecret,
      logGroup: monitoringStack.logGroup,
    });

    const stack = new ComputeStack(app, 'TestComputeStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
      vpc: networkingStack.vpc,
      dbSecret: databaseStack.dbSecret,
      dbSecurityGroup: databaseStack.dbSecurityGroup,
      taskRole: iamStack.taskRole,
      logGroup: monitoringStack.logGroup,
    });

    const template = Template.fromStack(stack).toJSON();
    expect(template).toMatchSnapshot();
  });
});
