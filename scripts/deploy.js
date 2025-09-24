#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

class DeploymentManager {
  constructor() {
    this.environment = process.argv[2] || 'staging';
    this.skipTests = process.argv.includes('--skip-tests');
    this.skipBuild = process.argv.includes('--skip-build');
    this.dryRun = process.argv.includes('--dry-run');

    this.config = this.loadConfig();
    this.startTime = Date.now();
  }

  loadConfig() {
    const configPath = path.join(__dirname, '..', 'deployment-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Default configuration
    return {
      environments: {
        staging: {
          region: 'us-east-1',
          domain: 'staging.moneyquest.app',
          stackName: 'MoneyQuestStack-staging',
          apiUrl: 'https://api-staging.moneyquest.app',
          s3Bucket: 'moneyquest-staging-frontend',
          cloudFrontDistribution: 'E1234567890ABC'
        },
        production: {
          region: 'us-east-1',
          domain: 'moneyquest.app',
          stackName: 'MoneyQuestStack-prod',
          apiUrl: 'https://api.moneyquest.app',
          s3Bucket: 'moneyquest-prod-frontend',
          cloudFrontDistribution: 'E0987654321XYZ'
        }
      },
      healthCheck: {
        maxRetries: 10,
        retryDelay: 5000,
        endpoints: ['/health', '/api/health']
      },
      rollback: {
        enabled: true,
        backupCount: 5
      }
    };
  }

  async run() {
    try {
      log('cyan', '🚀 MoneyQuest Deployment Manager');
      log('blue', `═══════════════════════════════════════`);
      log('yellow', `Environment: ${this.environment}`);
      log('yellow', `Dry Run: ${this.dryRun ? 'Yes' : 'No'}`);
      log('yellow', `Skip Tests: ${this.skipTests ? 'Yes' : 'No'}`);
      log('yellow', `Skip Build: ${this.skipBuild ? 'Yes' : 'No'}`);
      log('blue', `═══════════════════════════════════════`);

      const envConfig = this.config.environments[this.environment];
      if (!envConfig) {
        throw new Error(`Environment '${this.environment}' not found in configuration`);
      }

      // Pre-deployment checks
      await this.preDeploymentChecks();

      // Run tests
      if (!this.skipTests) {
        await this.runTests();
      }

      // Build applications
      if (!this.skipBuild) {
        await this.buildApplications();
      }

      // Create deployment backup
      await this.createDeploymentBackup();

      // Deploy infrastructure
      await this.deployInfrastructure();

      // Deploy backend
      await this.deployBackend();

      // Deploy frontend
      await this.deployFrontend();

      // Post-deployment verification
      await this.postDeploymentVerification();

      // Update monitoring
      await this.updateMonitoring();

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      log('green', `✅ Deployment completed successfully in ${duration}s`);

    } catch (error) {
      log('red', `❌ Deployment failed: ${error.message}`);

      if (!this.dryRun && this.config.rollback.enabled) {
        log('yellow', '🔄 Initiating automatic rollback...');
        await this.rollback();
      }

      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    log('cyan', '\n1. 🔍 Pre-deployment checks...');

    // Check AWS credentials
    try {
      execSync('aws sts get-caller-identity', { stdio: 'pipe' });
      log('green', '   ✅ AWS credentials configured');
    } catch (error) {
      throw new Error('AWS credentials not configured');
    }

    // Check required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'COGNITO_USER_POOL_ID',
      'S3_BACKUP_BUCKET',
      'STRIPE_SECRET_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        log('yellow', `   ⚠️  Environment variable ${envVar} not set`);
      } else {
        log('green', `   ✅ ${envVar} configured`);
      }
    }

    // Check git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim() && !this.dryRun) {
        log('yellow', '   ⚠️  Working directory has uncommitted changes');
      } else {
        log('green', '   ✅ Git working directory clean');
      }
    } catch (error) {
      log('yellow', '   ⚠️  Could not check git status');
    }

    // Check dependencies
    if (!fs.existsSync('node_modules')) {
      log('yellow', '   🔄 Installing dependencies...');
      execSync('npm ci', { stdio: 'inherit' });
    }
    log('green', '   ✅ Dependencies installed');
  }

  async runTests() {
    log('cyan', '\n2. 🧪 Running test suite...');

    const testCommands = [
      { name: 'TypeScript compilation', cmd: 'npm run typecheck' },
      { name: 'Linting', cmd: 'npm run lint' },
      { name: 'Unit tests', cmd: 'npm run test:unit -- --watchAll=false' },
      { name: 'Integration tests', cmd: 'npm run test:integration' },
      { name: 'Security tests', cmd: 'npm run test:security' }
    ];

    for (const test of testCommands) {
      try {
        log('blue', `   Running ${test.name}...`);
        if (!this.dryRun) {
          execSync(test.cmd, { stdio: 'pipe' });
        }
        log('green', `   ✅ ${test.name} passed`);
      } catch (error) {
        log('red', `   ❌ ${test.name} failed`);
        throw new Error(`Test failure: ${test.name}`);
      }
    }
  }

  async buildApplications() {
    log('cyan', '\n3. 🔨 Building applications...');

    const buildCommands = [
      { name: 'Backend functions', cmd: 'cd packages/backend && npm run build', path: 'packages/backend/dist' },
      { name: 'Website', cmd: 'cd packages/website && npm run build', path: 'packages/website/.next' },
      { name: 'Infrastructure', cmd: 'cd packages/infrastructure && npm run synth', path: 'packages/infrastructure/cdk.out' }
    ];

    for (const build of buildCommands) {
      try {
        log('blue', `   Building ${build.name}...`);
        if (!this.dryRun) {
          execSync(build.cmd, { stdio: 'pipe' });

          if (!fs.existsSync(build.path)) {
            throw new Error(`Build output not found: ${build.path}`);
          }
        }
        log('green', `   ✅ ${build.name} built successfully`);
      } catch (error) {
        log('red', `   ❌ ${build.name} build failed`);
        throw new Error(`Build failure: ${build.name}`);
      }
    }
  }

  async createDeploymentBackup() {
    log('cyan', '\n4. 💾 Creating deployment backup...');

    const envConfig = this.config.environments[this.environment];
    const backupId = `${this.environment}-${Date.now()}`;

    try {
      if (!this.dryRun) {
        // Backup current Lambda function code
        execSync(`aws lambda get-function --function-name moneyquest-${this.environment}-accounts --region ${envConfig.region} --query 'Code.Location' --output text | xargs curl -o backup-${backupId}-lambda.zip`, { stdio: 'pipe' });

        // Backup current S3 website content
        execSync(`aws s3 sync s3://${envConfig.s3Bucket} backup-${backupId}-s3/ --region ${envConfig.region}`, { stdio: 'pipe' });
      }

      log('green', `   ✅ Deployment backup created: ${backupId}`);
    } catch (error) {
      log('yellow', '   ⚠️  Could not create deployment backup');
    }
  }

  async deployInfrastructure() {
    log('cyan', '\n5. ☁️  Deploying infrastructure...');

    const envConfig = this.config.environments[this.environment];

    try {
      if (!this.dryRun) {
        execSync(`cd packages/infrastructure && npx cdk deploy ${envConfig.stackName} --require-approval never --context environment=${this.environment}`, { stdio: 'inherit' });
      }
      log('green', '   ✅ Infrastructure deployed successfully');
    } catch (error) {
      log('red', '   ❌ Infrastructure deployment failed');
      throw new Error('Infrastructure deployment failed');
    }
  }

  async deployBackend() {
    log('cyan', '\n6. ⚡ Deploying backend functions...');

    const functions = [
      'auth-register',
      'auth-login',
      'accounts',
      'transactions',
      'budgets',
      'backup-create',
      'backup-get',
      'subscriptions-upgrade',
      'webhooks-stripe'
    ];

    for (const func of functions) {
      try {
        log('blue', `   Deploying ${func}...`);
        if (!this.dryRun) {
          // Create deployment package
          execSync(`cd packages/backend/dist/functions && zip -r ${func}.zip ${func}/`, { stdio: 'pipe' });

          // Update Lambda function
          execSync(`aws lambda update-function-code --function-name moneyquest-${this.environment}-${func} --zip-file fileb://packages/backend/dist/functions/${func}.zip`, { stdio: 'pipe' });
        }
        log('green', `   ✅ ${func} deployed`);
      } catch (error) {
        log('red', `   ❌ ${func} deployment failed`);
        throw new Error(`Backend deployment failed: ${func}`);
      }
    }
  }

  async deployFrontend() {
    log('cyan', '\n7. 🌐 Deploying frontend...');

    const envConfig = this.config.environments[this.environment];

    try {
      if (!this.dryRun) {
        // Sync static files to S3
        execSync(`cd packages/website && aws s3 sync .next/static/ s3://${envConfig.s3Bucket}/static/ --delete`, { stdio: 'inherit' });

        // Invalidate CloudFront cache
        execSync(`aws cloudfront create-invalidation --distribution-id ${envConfig.cloudFrontDistribution} --paths "/*"`, { stdio: 'pipe' });
      }
      log('green', '   ✅ Frontend deployed successfully');
    } catch (error) {
      log('red', '   ❌ Frontend deployment failed');
      throw new Error('Frontend deployment failed');
    }
  }

  async postDeploymentVerification() {
    log('cyan', '\n8. ✅ Post-deployment verification...');

    const envConfig = this.config.environments[this.environment];
    const healthCheckConfig = this.config.healthCheck;

    for (const endpoint of healthCheckConfig.endpoints) {
      const url = `${envConfig.apiUrl}${endpoint}`;
      let attempts = 0;

      while (attempts < healthCheckConfig.maxRetries) {
        try {
          if (!this.dryRun) {
            execSync(`curl -f -s ${url}`, { stdio: 'pipe' });
          }
          log('green', `   ✅ Health check passed: ${endpoint}`);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= healthCheckConfig.maxRetries) {
            log('red', `   ❌ Health check failed: ${endpoint}`);
            throw new Error(`Health check failed for ${endpoint}`);
          }
          log('yellow', `   ⚠️  Health check attempt ${attempts}/${healthCheckConfig.maxRetries} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, healthCheckConfig.retryDelay));
        }
      }
    }

    // Run smoke tests
    try {
      if (!this.dryRun) {
        execSync(`npm run test:smoke:${this.environment}`, { stdio: 'pipe' });
      }
      log('green', '   ✅ Smoke tests passed');
    } catch (error) {
      log('red', '   ❌ Smoke tests failed');
      throw new Error('Smoke tests failed');
    }
  }

  async updateMonitoring() {
    log('cyan', '\n9. 📊 Updating monitoring and alerts...');

    try {
      if (!this.dryRun) {
        // Update CloudWatch alarms
        execSync(`node scripts/setup-monitoring.js --environment=${this.environment}`, { stdio: 'pipe' });

        // Send deployment notification
        const deploymentInfo = {
          environment: this.environment,
          version: process.env.GITHUB_SHA || 'local',
          timestamp: new Date().toISOString(),
          duration: ((Date.now() - this.startTime) / 1000).toFixed(2)
        };

        if (process.env.SLACK_WEBHOOK) {
          execSync(`curl -X POST ${process.env.SLACK_WEBHOOK} -H "Content-Type: application/json" -d '${JSON.stringify({
            text: `🚀 MoneyQuest deployed to ${this.environment}`,
            attachments: [{
              color: 'good',
              fields: Object.entries(deploymentInfo).map(([key, value]) => ({
                title: key.charAt(0).toUpperCase() + key.slice(1),
                value: value,
                short: true
              }))
            }]
          })}'`, { stdio: 'pipe' });
        }
      }
      log('green', '   ✅ Monitoring updated');
    } catch (error) {
      log('yellow', '   ⚠️  Could not update monitoring');
    }
  }

  async rollback() {
    log('cyan', '\n🔄 Initiating rollback...');

    try {
      // Find the most recent backup
      const backups = fs.readdirSync('.').filter(file => file.startsWith(`backup-${this.environment}-`));

      if (backups.length === 0) {
        log('red', '   ❌ No backups found for rollback');
        return;
      }

      const latestBackup = backups.sort().pop();
      const backupId = latestBackup.split('-').slice(1, -1).join('-');

      log('blue', `   Rolling back to backup: ${backupId}`);

      const envConfig = this.config.environments[this.environment];

      // Rollback Lambda functions
      if (fs.existsSync(`backup-${backupId}-lambda.zip`)) {
        execSync(`aws lambda update-function-code --function-name moneyquest-${this.environment}-accounts --zip-file fileb://backup-${backupId}-lambda.zip`, { stdio: 'pipe' });
      }

      // Rollback S3 content
      if (fs.existsSync(`backup-${backupId}-s3/`)) {
        execSync(`aws s3 sync backup-${backupId}-s3/ s3://${envConfig.s3Bucket} --delete`, { stdio: 'pipe' });
        execSync(`aws cloudfront create-invalidation --distribution-id ${envConfig.cloudFrontDistribution} --paths "/*"`, { stdio: 'pipe' });
      }

      log('green', '   ✅ Rollback completed successfully');
    } catch (error) {
      log('red', `   ❌ Rollback failed: ${error.message}`);
    }
  }
}

// Parse command line arguments
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.run();
}

module.exports = DeploymentManager;