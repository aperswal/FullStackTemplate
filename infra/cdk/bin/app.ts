#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { getConfig, requireAccount } from '../config';
import { buildDeploymentGroup } from '../lib/deployment-group';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') as string | undefined;
const config = getConfig(stage);
requireAccount(config);

const env: cdk.Environment = {
  account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region || process.env.CDK_DEFAULT_REGION,
};

buildDeploymentGroup(app, config, env);

app.synth();
