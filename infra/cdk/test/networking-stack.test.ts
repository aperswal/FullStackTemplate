import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkingStack } from '../lib/networking-stack';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

describe('NetworkingStack', () => {
  it('matches snapshot', () => {
    const app = new cdk.App();

    const stack = new NetworkingStack(app, 'TestNetworkingStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const template = Template.fromStack(stack).toJSON();
    expect(template).toMatchSnapshot();
  });
});
