import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import type { EnvironmentConfig } from '../config';

interface IamStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  uploadPolicy: iam.ManagedPolicy;
  dbSecret: secretsmanager.ISecret;
  logGroup: logs.LogGroup;
}

export class IamStack extends cdk.Stack {
  public readonly taskRole: iam.Role;
  public readonly deployRole: iam.Role | undefined;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const { config, uploadPolicy, dbSecret, logGroup } = props;

    // ECS task role - permissions the running application has
    this.taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${config.appName}-task-role-${config.stageName}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role assumed by ECS tasks with least-privilege app permissions',
    });

    // Attach S3 upload policy (previously orphaned)
    this.taskRole.addManagedPolicy(uploadPolicy);

    // CloudWatch Logs - write to app log group
    this.taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`],
      }),
    );

    // Secrets Manager - read database credentials
    this.taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [dbSecret.secretArn],
      }),
    );

    // GitHub Actions OIDC provider + deploy role
    if (config.githubOrg && config.githubRepo) {
      const oidcProvider = new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
      });

      this.deployRole = new iam.Role(this, 'GithubActionsDeployRole', {
        roleName: `${config.appName}-github-deploy-${config.stageName}`,
        assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': `repo:${config.githubOrg}/${config.githubRepo}:*`,
          },
        }),
        description: 'Role assumed by GitHub Actions via OIDC for deployments',
        maxSessionDuration: cdk.Duration.hours(1),
      });

      // Permissions for deployment: ECR, ECS, CloudFormation, S3 (CDK assets)
      this.deployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'ecr:PutImage',
            'ecr:InitiateLayerUpload',
            'ecr:UploadLayerPart',
            'ecr:CompleteLayerUpload',
          ],
          resources: ['*'],
        }),
      );

      this.deployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecs:UpdateService',
            'ecs:DescribeServices',
            'ecs:DescribeTaskDefinition',
            'ecs:RegisterTaskDefinition',
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'aws:ResourceTag/AppName': config.appName,
            },
          },
        }),
      );

      // CDK deployment permissions
      this.deployRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
      );

      new cdk.CfnOutput(this, 'DeployRoleArn', {
        value: this.deployRole.roleArn,
        description:
          'GitHub Actions deploy role ARN - use with aws-actions/configure-aws-credentials',
      });
    }

    new cdk.CfnOutput(this, 'TaskRoleArn', {
      value: this.taskRole.roleArn,
      description: 'ECS task role ARN',
    });
  }
}
