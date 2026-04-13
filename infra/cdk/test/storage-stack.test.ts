import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { StorageStack } from '../lib/storage-stack';
import { TEST_CONFIG, TEST_ENV } from './test-helper';

describe('StorageStack', () => {
  it('matches snapshot', () => {
    const app = new cdk.App();

    const stack = new StorageStack(app, 'TestStorageStack', {
      env: TEST_ENV,
      config: TEST_CONFIG,
    });

    const template = Template.fromStack(stack).toJSON();
    expect(template).toMatchSnapshot();
  });
});
