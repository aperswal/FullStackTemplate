import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../config';

export const TEST_CONFIG = getConfig('dev');
export const TEST_ENV: cdk.Environment = { account: '123456789012', region: 'us-east-1' };
