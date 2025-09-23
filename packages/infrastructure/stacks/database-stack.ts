import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';

export class DatabaseStack extends Stack {
  public readonly database: rds.DatabaseCluster;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // KMS key for encryption (GDPR & SOC 2 requirement)
    const kmsKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: 'MoneyQuestV3 Database Encryption Key',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // VPC for database isolation (SOC 2 requirement)
    this.vpc = new ec2.Vpc(this, 'MoneyQuestVpc', {
      maxAzs: 2,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
      encryptionKey: kmsKey,
      description: 'MoneyQuestV3 Database Credentials',
    });

    // Database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'MoneyQuestV3 Database Subnet Group',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Security group for database
    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'MoneyQuestV3 Database Security Group',
      allowAllOutbound: false,
    });

    // Aurora Serverless v2 cluster
    this.database = new rds.DatabaseCluster(this, 'MoneyQuestDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 16,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', { scaleWithWriter: true }),
      ],
      vpc: this.vpc,
      subnetGroup,
      securityGroups: [databaseSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: Duration.days(35), // SOC 2 requirement
      deletionProtection: true,
      cloudwatchLogsExports: ['postgresql'], // Audit logging
      cloudwatchLogsRetention: 90, // Days
      removalPolicy: RemovalPolicy.RETAIN,
      defaultDatabaseName: 'moneyquest',
    });

    // Create additional read replica for reporting (optional)
    const reportingInstance = rds.ClusterInstance.serverlessV2('reporting-reader', {
      publiclyAccessible: false,
    });
    this.database.addReader(reportingInstance);
  }
}