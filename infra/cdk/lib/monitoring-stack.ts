import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';
import type { EnvironmentConfig } from '../config';

interface MonitoringStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class MonitoringStack extends cdk.Stack {
  public readonly logGroup: logs.LogGroup;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Application log group
    this.logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/${config.appName}/${config.stageName}/app`,
      retention: this.mapRetentionDays(config.logRetentionDays),
      removalPolicy:
        config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // SNS alarm topic
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${config.appName}-alarms-${config.stageName}`,
      displayName: `${config.appName} ${config.stageName} Alarms`,
    });

    if (config.alarmEmail) {
      this.alarmTopic.addSubscription(new sns_subscriptions.EmailSubscription(config.alarmEmail));
    }

    // --- Metric Filters --------------------------------------
    const metricNamespace = `${config.appName}/${config.stageName}`;

    const errorMetricFilter = new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'error'),
      metricNamespace,
      metricName: 'ErrorCount',
      metricValue: '1',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'WarnMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'warn'),
      metricNamespace,
      metricName: 'WarnCount',
      metricValue: '1',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'LatencyMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.exists('$.responseTime'),
      metricNamespace,
      metricName: 'ResponseTimeMs',
      metricValue: '$.responseTime',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, '4xxMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.all(
        logs.FilterPattern.numberValue('$.statusCode', '>=', 400),
        logs.FilterPattern.numberValue('$.statusCode', '<', 500),
      ),
      metricNamespace,
      metricName: 'Http4xxCount',
      metricValue: '1',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, '5xxMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.numberValue('$.statusCode', '>=', 500),
      metricNamespace,
      metricName: 'Http5xxCount',
      metricValue: '1',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'AuthFailureMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.all(
        logs.FilterPattern.stringValue('$.context', '=', 'auth'),
        logs.FilterPattern.stringValue('$.level', '=', 'error'),
      ),
      metricNamespace,
      metricName: 'AuthFailureCount',
      metricValue: '1',
      defaultValue: 0,
    });

    // --- Alarms ----------------------------------------------

    const errorAlarm = new cloudwatch.Alarm(this, 'ErrorRateAlarm', {
      alarmName: `${config.appName}-${config.stageName}-error-rate`,
      alarmDescription: `High error rate detected in ${config.stageName} environment`,
      metric: errorMetricFilter.metric({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // --- CloudTrail ------------------------------------------

    const trailBucket = new s3.Bucket(this, 'TrailBucket', {
      bucketName: `${config.appName}-trail-${config.stageName}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stageName !== 'production',
      lifecycleRules: [
        {
          id: 'expire-old-trail-logs',
          expiration: cdk.Duration.days(config.stageName === 'production' ? 365 : 30),
        },
      ],
    });

    new cloudtrail.Trail(this, 'AppTrail', {
      trailName: `${config.appName}-${config.stageName}`,
      bucket: trailBucket,
      isMultiRegionTrail: false,
      includeGlobalServiceEvents: config.stageName === 'production',
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'TrailLogGroup', {
        logGroupName: `/${config.appName}/${config.stageName}/cloudtrail`,
        retention: this.mapRetentionDays(config.logRetentionDays),
        removalPolicy:
          config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      }),
    });

    // --- CloudWatch Dashboard --------------------------------

    const dashboard = new cloudwatch.Dashboard(this, 'AppDashboard', {
      dashboardName: `${config.appName}-${config.stageName}`,
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# ${config.appName} - ${config.stageName}\nApplication health dashboard`,
        width: 24,
        height: 1,
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error & Warning Rate',
        left: [
          new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'ErrorCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Errors',
            color: '#d13212',
          }),
          new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'WarnCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Warnings',
            color: '#ff9900',
          }),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'HTTP Status Codes',
        left: [
          new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'Http4xxCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '4xx Client Errors',
            color: '#ff9900',
          }),
          new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'Http5xxCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: '5xx Server Errors',
            color: '#d13212',
          }),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Auth Failures',
        left: [
          new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'AuthFailureCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Auth Failures',
            color: '#d13212',
          }),
        ],
        width: 8,
      }),
    );

    // --- Outputs ----------------------------------------------

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch log group name',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${config.appName}-${config.stageName}`,
      description: 'CloudWatch dashboard URL',
    });
  }

  private mapRetentionDays(days: number): logs.RetentionDays {
    if (days <= 1) return logs.RetentionDays.ONE_DAY;
    if (days <= 3) return logs.RetentionDays.THREE_DAYS;
    if (days <= 5) return logs.RetentionDays.FIVE_DAYS;
    if (days <= 7) return logs.RetentionDays.ONE_WEEK;
    if (days <= 14) return logs.RetentionDays.TWO_WEEKS;
    if (days <= 30) return logs.RetentionDays.ONE_MONTH;
    if (days <= 60) return logs.RetentionDays.TWO_MONTHS;
    if (days <= 90) return logs.RetentionDays.THREE_MONTHS;
    if (days <= 120) return logs.RetentionDays.FOUR_MONTHS;
    if (days <= 150) return logs.RetentionDays.FIVE_MONTHS;
    if (days <= 180) return logs.RetentionDays.SIX_MONTHS;
    if (days <= 365) return logs.RetentionDays.ONE_YEAR;
    return logs.RetentionDays.INFINITE;
  }
}
