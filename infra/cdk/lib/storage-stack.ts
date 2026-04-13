import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import type { EnvironmentConfig } from '../config';

interface StorageStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class StorageStack extends cdk.Stack {
  public readonly uploadBucket: s3.Bucket;
  public readonly uploadPolicy: iam.ManagedPolicy;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { config } = props;

    this.uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: `${config.appName}-uploads-${config.stageName}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stageName !== 'production',
      lifecycleRules: [
        {
          id: 'cleanup-incomplete-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: [config.appUrl],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    this.uploadPolicy = new iam.ManagedPolicy(this, 'UploadBucketPolicy', {
      managedPolicyName: `${config.appName}-upload-access-${config.stageName}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
          resources: [this.uploadBucket.bucketArn, `${this.uploadBucket.bucketArn}/*`],
        }),
      ],
    });

    new cdk.CfnOutput(this, 'UploadBucketName', {
      value: this.uploadBucket.bucketName,
      description: 'Name of the S3 upload bucket',
    });

    new cdk.CfnOutput(this, 'UploadBucketArn', {
      value: this.uploadBucket.bucketArn,
      description: 'ARN of the S3 upload bucket',
    });

    new cdk.CfnOutput(this, 'UploadPolicyArn', {
      value: this.uploadPolicy.managedPolicyArn,
      description: 'ARN of the upload access managed policy',
    });
  }
}
