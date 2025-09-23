#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { DatabaseStack } from '../stacks/database-stack';
import { ApiStack } from '../stacks/api-stack';
import { FrontendStack } from '../stacks/frontend-stack';
import { GdprStack } from '../stacks/gdpr-stack';

const app = new App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Database Stack (RDS Aurora Serverless v2)
const databaseStack = new DatabaseStack(app, 'MoneyQuestV3-Database', {
  env,
  description: 'MoneyQuestV3 Database Stack - Aurora Serverless v2 with PostgreSQL',
});

// API Stack (Lambda + API Gateway)
const apiStack = new ApiStack(app, 'MoneyQuestV3-Api', {
  env,
  description: 'MoneyQuestV3 API Stack - Lambda functions and API Gateway',
  database: databaseStack.database,
  databaseSecret: databaseStack.databaseSecret,
});

// Frontend Stack (S3 + CloudFront)
const frontendStack = new FrontendStack(app, 'MoneyQuestV3-Frontend', {
  env,
  description: 'MoneyQuestV3 Frontend Stack - S3 bucket and CloudFront distribution',
  apiGateway: apiStack.apiGateway,
});

// GDPR Compliance Stack
const gdprStack = new GdprStack(app, 'MoneyQuestV3-Gdpr', {
  env,
  description: 'MoneyQuestV3 GDPR Compliance Stack - Data retention and audit logging',
  database: databaseStack.database,
});

// Add dependencies
apiStack.addDependency(databaseStack);
frontendStack.addDependency(apiStack);
gdprStack.addDependency(databaseStack);