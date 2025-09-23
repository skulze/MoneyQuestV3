# MoneyQuestV3 - Personal Finance App

A GDPR & SOC 2 Type II compliant personal finance web application that enables users to track spending, split transactions across multiple categories, and analyze financial patterns through a hybrid client-server analytics architecture.

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL (for local development)
- AWS CLI configured (for deployment)

### Installation

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd MoneyQuestV3
npm run install:all
```

2. Set up environment variables:
```bash
# Copy example environment files
cp packages/frontend/.env.example packages/frontend/.env.local
cp packages/backend/.env.example packages/backend/.env
```

3. Set up the database:
```bash
# Start PostgreSQL locally or use Docker
npm run db:setup
npm run db:migrate
```

4. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend (Next.js) on http://localhost:3000
- Backend API simulation

### Available Scripts

#### Development
- `npm run dev` - Start all development servers
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only

#### Building
- `npm run build` - Build all packages
- `npm run typecheck` - Type check all packages
- `npm run lint` - Lint all packages

#### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

#### Testing
- `npm run test` - Run all tests
- `npm run security-audit` - Run security scan

#### Deployment
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:prod` - Deploy to production

## Project Structure

```
MoneyQuestV3/
├── packages/
│   ├── frontend/          # Next.js application
│   ├── backend/           # Lambda functions
│   ├── shared/            # Shared TypeScript types
│   └── infrastructure/    # AWS CDK stacks
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
└── package.json           # Monorepo configuration
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query
- **Backend**: AWS Lambda, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Aurora Serverless v2)
- **Infrastructure**: AWS CDK v2
- **Security**: Semgrep for static analysis

## Features

### Core Financial Management
- Transaction splitting across multiple categories
- Real-time analytics dashboard
- Budget management system
- Advanced reporting & exports

### Security & Compliance
- GDPR compliance with consent management
- SOC 2 Type II controls
- Data encryption at rest and in transit
- Comprehensive audit logging

## Environment Setup

### Local Development Environment Variables

Create the following environment files:

**packages/frontend/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AWS_REGION=us-east-1
```

**packages/backend/.env:**
```
DATABASE_URL=postgresql://username:password@localhost:5432/moneyquest
AWS_REGION=us-east-1
NODE_ENV=development
```

### Database Setup

1. Install PostgreSQL locally or use Docker:
```bash
# Using Docker
docker run --name moneyquest-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=moneyquest -p 5432:5432 -d postgres:15

# Or install PostgreSQL locally
```

2. Run migrations:
```bash
npm run db:migrate
```

## Development Workflow

1. Make changes to code
2. Run type checking: `npm run typecheck`
3. Run linting: `npm run lint`
4. Run security audit: `npm run security-audit`
5. Test locally: `npm run dev`
6. Commit changes

## Deployment

### AWS Infrastructure

The application uses AWS CDK for infrastructure as code. Deploy to AWS:

1. Configure AWS credentials
2. Bootstrap CDK (first time only):
```bash
cd packages/infrastructure
npm run bootstrap
```

3. Deploy:
```bash
npm run deploy:staging  # or deploy:prod
```

## Security

- Static code analysis with Semgrep
- GDPR compliance controls
- SOC 2 Type II security standards
- Encryption at rest and in transit

## Contributing

1. Follow the existing code style
2. Add tests for new functionality
3. Ensure all checks pass
4. Update documentation as needed

## License

UNLICENSED - Private project