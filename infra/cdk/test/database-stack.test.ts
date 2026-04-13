import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkingStack } from '../lib/networking-stack';
import { DatabaseStack } from '../lib/database-stack';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

describe('DatabaseStack', () => {
  it('matches snapshot', () => {
    const app = new cdk.App();

    const networkingStack = new NetworkingStack(app, 'TestNetworkingStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const stack = new DatabaseStack(app, 'TestDatabaseStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
      vpc: networkingStack.vpc,
    });

    const template = Template.fromStack(stack).toJSON();
    expect(template).toMatchSnapshot();
  });
});
