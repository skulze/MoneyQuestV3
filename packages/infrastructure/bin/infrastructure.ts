#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MoneyQuestStack } from '../lib/moneyquest-stack';

const app = new cdk.App();

// Get environment from context or default to dev
const environment = app.node.tryGetContext('environment') || 'dev';

// Environment-specific configuration
const config = {
  dev: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
    environment: 'dev' as const,
  },
  staging: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    environment: 'staging' as const,
    domainName: 'staging.moneyquest.app',
  },
  prod: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    environment: 'prod' as const,
    domainName: 'api.moneyquest.app',
  },
};

// Create the stack
new MoneyQuestStack(app, `MoneyQuestStack-${environment}`, config[environment as keyof typeof config]);

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'MoneyQuest');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Owner', 'MoneyQuest Team');