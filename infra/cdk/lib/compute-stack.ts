import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import type { EnvironmentConfig } from '../config';

interface ComputeStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  dbSecret: secretsmanager.ISecret;
  dbSecurityGroup: ec2.SecurityGroup;
  taskRole: iam.Role;
  logGroup: logs.LogGroup;
}

export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { config, vpc, dbSecret, dbSecurityGroup, taskRole, logGroup } = props;

    // ECS Cluster with Container Insights for all environments
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `${config.appName}-${config.stageName}`,
      vpc,
      containerInsights: true,
    });

    // ALB access log bucket
    const albLogBucket = new s3.Bucket(this, 'AlbLogBucket', {
      bucketName: `${config.appName}-alb-logs-${config.stageName}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stageName !== 'production',
      lifecycleRules: [
        {
          id: 'expire-old-logs',
          expiration: cdk.Duration.days(config.stageName === 'production' ? 90 : 14),
        },
      ],
    });

    // ALB Security Group — accepts HTTP/HTTPS from internet
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      securityGroupName: `${config.appName}-alb-sg-${config.stageName}`,
      description: 'Security group for ALB — accepts public HTTP/HTTPS traffic',
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP from internet');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from internet');

    // App Security Group — accepts traffic only from ALB
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      securityGroupName: `${config.appName}-app-sg-${config.stageName}`,
      description: 'Security group for Fargate tasks — accepts traffic only from ALB',
    });
    appSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(3000), 'HTTP from ALB only');

    // Allow app to connect to database — use L1 construct to keep the resource
    // in ComputeStack and avoid a cross-stack dependency cycle
    new ec2.CfnSecurityGroupIngress(this, 'DbIngressFromApp', {
      groupId: dbSecurityGroup.securityGroupId,
      sourceSecurityGroupId: appSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      description: 'PostgreSQL from app tasks',
    });

    // ALB with access logging
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: `${config.appName}-${config.stageName}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    this.alb.logAccessLogs(albLogBucket, `alb/${config.stageName}`);

    // Task Definition with X-Ray sidecar
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: config.cpu,
      memoryLimitMiB: config.memory,
      taskRole,
    });

    // Main application container
    const container = taskDefinition.addContainer('web', {
      image: config.dockerImage
        ? ecs.ContainerImage.fromRegistry(config.dockerImage)
        : ecs.ContainerImage.fromRegistry('node:22-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'web',
      }),
      environment: {
        NODE_ENV: 'production',
        DEPLOY_TARGET: 'docker',
        PORT: '3000',
        AWS_XRAY_DAEMON_ADDRESS: 'localhost:2000',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'wget -q --spider http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({ containerPort: 3000 });

    // X-Ray daemon sidecar for distributed tracing
    const xrayContainer = taskDefinition.addContainer('xray-daemon', {
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon:3.3.15'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'xray',
      }),
      memoryReservationMiB: 64,
      essential: false,
    });

    xrayContainer.addPortMappings({ containerPort: 2000, protocol: ecs.Protocol.UDP });

    // X-Ray permissions for the task role
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
        ],
        resources: ['*'],
      }),
    );

    // Fargate Service
    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: `${config.appName}-web-${config.stageName}`,
      cluster: this.cluster,
      taskDefinition,
      desiredCount: config.desiredTaskCount,
      securityGroups: [appSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
    });

    // ALB Target Group + Listener
    const listener = this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('WebTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      healthCheck: {
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: config.desiredTaskCount,
      maxCapacity: config.desiredTaskCount * 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS name',
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS service ARN',
    });
  }
}
