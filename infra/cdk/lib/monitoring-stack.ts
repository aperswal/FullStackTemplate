import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
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

    this.logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/${config.appName}/${config.stageName}/app`,
      retention: this.mapRetentionDays(config.logRetentionDays),
      removalPolicy:
        config.stageName === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${config.appName}-alarms-${config.stageName}`,
      displayName: `${config.appName} ${config.stageName} Alarms`,
    });

    if (config.alarmEmail) {
      this.alarmTopic.addSubscription(new sns_subscriptions.EmailSubscription(config.alarmEmail));
    }

    const errorMetricFilter = new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup: this.logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'error'),
      metricNamespace: `${config.appName}/${config.stageName}`,
      metricName: 'ErrorCount',
      metricValue: '1',
      defaultValue: 0,
    });

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

    // S3 bucket metrics can be added via CloudWatch custom metrics if needed

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch log group name',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
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
