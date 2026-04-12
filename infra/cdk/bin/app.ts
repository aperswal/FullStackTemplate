#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../config';
import { StorageStack } from '../lib/storage-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') as string | undefined;
const config = getConfig(stage);

const env: cdk.Environment = {
  account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region || process.env.CDK_DEFAULT_REGION,
};

const _storageStack = new StorageStack(app, `${config.appName}-storage-${config.stageName}`, {
  env,
  config,
});

new MonitoringStack(app, `${config.appName}-monitoring-${config.stageName}`, {
  env,
  config,
});

app.synth();
