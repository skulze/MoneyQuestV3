import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface MoneyQuestStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
  domainName?: string;
}

export class MoneyQuestStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly api: apigateway.RestApi;
  public readonly database: rds.DatabaseCluster;
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: MoneyQuestStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // VPC for RDS
    const vpc = new ec2.Vpc(this, 'MoneyQuestVPC', {
      maxAzs: 2,
      natGateways: environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Database secrets
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // RDS Aurora Serverless v2 for PostgreSQL
    this.database = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        scaleWithWriter: true,
      }),
      readers: environment === 'prod' ? [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
        }),
      ] : [],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: environment === 'prod' ? 16 : 4,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      defaultDatabaseName: 'moneyquest',
      backup: {
        retention: environment === 'prod' ? cdk.Duration.days(7) : cdk.Duration.days(1),
      },
      deletionProtection: environment === 'prod',
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for encrypted backups
    this.backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `moneyquest-backups-${environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `MoneyQuest-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        subscriptionTier: new cognito.StringAttribute({
          defaultValue: 'FREE',
          mutable: true,
        }),
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      },
    });

    // Cognito User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Lambda execution role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant database access
    this.database.secret?.grantRead(lambdaExecutionRole);

    // Grant S3 access
    this.backupBucket.grantReadWrite(lambdaExecutionRole);

    // Lambda layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('../backend/layers/shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for MoneyQuest Lambda functions',
    });

    // Create Lambda functions
    const lambdaFunctions = this.createLambdaFunctions(lambdaExecutionRole, sharedLayer, environment);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'MoneyQuestAPI', {
      restApiName: `MoneyQuest API ${environment}`,
      description: `MoneyQuest API for ${environment} environment`,
      defaultCorsPreflightOptions: {
        allowOrigins: environment === 'prod'
          ? ['https://moneyquest.app', 'https://www.moneyquest.app']
          : apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: environment,
        throttle: {
          rateLimit: environment === 'prod' ? 1000 : 100,
          burstLimit: environment === 'prod' ? 2000 : 200,
        },
      },
    });

    // API Gateway Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [this.userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // Create API routes
    this.createAPIRoutes(lambdaFunctions, cognitoAuthorizer);

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 backup bucket name',
    });
  }

  private createLambdaFunctions(
    executionRole: iam.Role,
    sharedLayer: lambda.LayerVersion,
    environment: string
  ): Record<string, lambda.Function> {
    const functions: Record<string, lambda.Function> = {};

    const functionConfigs = [
      { name: 'auth-register', path: 'auth/register' },
      { name: 'auth-login', path: 'auth/login' },
      { name: 'auth-refresh', path: 'auth/refresh' },
      { name: 'accounts', path: 'accounts/accounts' },
      { name: 'transactions', path: 'transactions/transactions' },
      { name: 'budgets', path: 'budgets/budgets' },
      { name: 'analytics', path: 'analytics/analytics' },
      { name: 'backup-create', path: 'backup/create' },
      { name: 'backup-get', path: 'backup/get' },
      { name: 'subscriptions-upgrade', path: 'subscriptions/upgrade' },
      { name: 'subscriptions-manage', path: 'subscriptions/manage' },
      { name: 'webhooks-stripe', path: 'webhooks/stripe' },
    ];

    functionConfigs.forEach(({ name, path }) => {
      functions[name] = new lambda.Function(this, `${name}Function`, {
        functionName: `moneyquest-${environment}-${name}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`../backend/dist/functions/${path}`),
        role: executionRole,
        layers: [sharedLayer],
        environment: {
          NODE_ENV: environment,
          DATABASE_URL: this.database.clusterEndpoint.socketAddress,
          COGNITO_USER_POOL_ID: this.userPool.userPoolId,
          COGNITO_CLIENT_ID: this.userPoolClient.userPoolClientId,
          S3_BACKUP_BUCKET: this.backupBucket.bucketName,
          AWS_REGION: this.region,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        reservedConcurrentExecutions: environment === 'prod' ? 100 : 10,
      });
    });

    return functions;
  }

  private createAPIRoutes(
    functions: Record<string, lambda.Function>,
    authorizer: apigateway.CognitoUserPoolsAuthorizer
  ): void {
    // Auth routes (no authorization needed)
    const authResource = this.api.root.addResource('auth');
    authResource.addResource('register').addMethod('POST',
      new apigateway.LambdaIntegration(functions['auth-register'])
    );
    authResource.addResource('login').addMethod('POST',
      new apigateway.LambdaIntegration(functions['auth-login'])
    );
    authResource.addResource('refresh').addMethod('POST',
      new apigateway.LambdaIntegration(functions['auth-refresh'])
    );

    // Accounts routes (authorized)
    const accountsResource = this.api.root.addResource('accounts');
    const accountResource = accountsResource.addResource('{accountId}');

    accountsResource.addMethod('GET',
      new apigateway.LambdaIntegration(functions['accounts']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    accountsResource.addMethod('POST',
      new apigateway.LambdaIntegration(functions['accounts']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    accountResource.addMethod('GET',
      new apigateway.LambdaIntegration(functions['accounts']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    accountResource.addMethod('PUT',
      new apigateway.LambdaIntegration(functions['accounts']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    accountResource.addMethod('DELETE',
      new apigateway.LambdaIntegration(functions['accounts']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Backup routes (authorized)
    const backupResource = this.api.root.addResource('backup');
    const backupIdResource = backupResource.addResource('{backupId}');

    backupResource.addMethod('GET',
      new apigateway.LambdaIntegration(functions['backup-get']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    backupResource.addMethod('POST',
      new apigateway.LambdaIntegration(functions['backup-create']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    backupIdResource.addMethod('GET',
      new apigateway.LambdaIntegration(functions['backup-get']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Subscription routes (authorized)
    const subscriptionsResource = this.api.root.addResource('subscriptions');
    subscriptionsResource.addResource('upgrade').addMethod('POST',
      new apigateway.LambdaIntegration(functions['subscriptions-upgrade']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    subscriptionsResource.addResource('manage').addMethod('POST',
      new apigateway.LambdaIntegration(functions['subscriptions-manage']), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Webhook routes (no authorization needed, validated by Stripe signature)
    const webhooksResource = this.api.root.addResource('webhooks');
    webhooksResource.addResource('stripe').addMethod('POST',
      new apigateway.LambdaIntegration(functions['webhooks-stripe'])
    );
  }
}