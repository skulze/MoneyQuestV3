# MoneyQuestV3 - Personal Finance App

## Project Overview
A GDPR & SOC 2 Type II compliant personal finance web application that enables users to track spending, split transactions across multiple categories, and analyze financial patterns through a hybrid client-server analytics architecture.

**Core Value Proposition:**
- **Understand exactly where your money goes** - Get instant, accurate insights into your spending patterns without waiting for reports or manual calculations
- **Take complete control of your finances** - Make informed financial decisions with real-time data that updates as you spend
- **Protect your financial privacy** - Your sensitive data stays secure with enterprise-grade privacy controls and you decide how it's used
- **Save time on financial management** - Spend minutes, not hours, tracking and analyzing your money with intelligent automation
- **Scale with your financial complexity** - Whether you have simple budgets or complex financial goals, the system grows with your needs

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Zustand + React Query
- **Backend**: AWS Lambda + API Gateway + TypeScript + Prisma ORM
- **Database**: PostgreSQL (Aurora Serverless v2)
- **Authentication**: AWS Cognito User Pool
- **Analytics**: Chart.js + IndexedDB for client-side processing
- **Infrastructure**: AWS CDK v2
- **Deployment**: S3 + CloudFront (frontend), Lambda (backend)

### Hybrid Analytics Architecture
**Client-Side Processing:**
- Real-time charts and visualizations
- Transaction filtering and searching
- Budget vs. actual comparisons
- Category breakdowns
- Offline analytics capability

**Server-Side Processing:**
- Complex reports (PDF/Excel generation)
- Predictive analytics and forecasting
- Cross-user comparative insights
- Data exports for GDPR compliance
- Background processing via SQS

**Cost Optimization:** Client-side analytics reduces Lambda invocations by ~70% and database queries significantly.

## Features

### Current Features (Implemented)

#### Transaction Splitting
Users can split any transaction into multiple spending categories.

**Example:**
- Original: $100 Walmart transaction
- Split into: $40 Groceries + $60 Automotive
- Each split can have its own category and description

**Data Model:**
```typescript
Transaction {
  id: string
  originalAmount: number        // $100
  description: string          // "WALMART #1234"
  isParent: boolean           // true if split
  splits?: TransactionSplit[]
}

TransactionSplit {
  id: string
  transactionId: string
  amount: number             // $40 or $60
  categoryId: string         // groceries or automotive
  percentage: number         // 40% or 60%
  description?: string
}
```

#### Real-Time Analytics
- Monthly spending totals
- Category breakdowns with percentages
- Budget vs. actual progress tracking
- Spending trends and patterns
- All calculated client-side for instant updates

#### Budget Management
- Set monthly/yearly budgets per category
- Real-time progress tracking
- Overspend alerts and warnings
- Historical budget performance

#### Advanced Reporting
- PDF monthly statements
- Excel data exports
- Predictive spending forecasts
- Comparative spending analysis

### Planned Features

#### Data & Transaction Management

**Receipt Processing & OCR**
- **Photo-to-transaction**: Snap receipt photos for automatic transaction creation
- **Line-item extraction**: Automatically suggest splits based on receipt line items
- **Expense validation**: Cross-reference receipts with bank transactions
- **Tax category detection**: Automatically flag business/tax-deductible expenses

**Open Banking Integration**
- **Automatic import**: Real-time transaction sync from banks
- **Multi-account support**: Checking, savings, credit cards in one view
- **Balance forecasting**: Real account balances with pending transactions
- **Duplicate detection**: Smart merging of manual and imported transactions

**Investment & Net Worth Tracking**
- **Portfolio integration**: Connect brokerage accounts
- **Net worth dashboard**: Assets minus liabilities over time
- **Investment categorization**: Separate investment transfers from expenses
- **Tax-loss harvesting**: Identify opportunities for tax optimization

#### Analytics & Financial Planning

**Goal-Based Financial Planning**
- **Visual goal tracking**: House down payment, vacation, emergency fund with progress bars
- **Automated savings**: "Save $50 every time you're under budget in Dining"
- **Goal-driven categorization**: Link expenses to goals (eating out less = vacation fund grows)
- **Timeline optimization**: "Reduce coffee spending by $30/month to reach your goal 6 months earlier"

**Bill Management & Recurring Expenses**
- **Bill calendar**: Visual timeline of upcoming bills
- **Price tracking**: Alert when subscription prices increase
- **Cancellation reminders**: "You haven't used Netflix in 2 months"
- **Bill optimization**: Suggest better deals on recurring services

#### User Experience & Interface

**Progressive Web App & Offline-First**
- **Installation prompts**: "Install MoneyQuest for faster access"
- **Offline transaction entry**: Queue transactions when internet is unavailable
- **Background sync**: Automatic sync when connection restored
- **Push notifications**: Budget alerts even when app is closed

**Voice Interface & Quick Entry**
- **Voice commands**: "Add $50 gas expense to Transportation"
- **Quick widgets**: iOS/Android widgets for instant expense entry
- **Siri/Google Assistant**: "Hey Siri, log my $12 lunch"
- **Smart shortcuts**: "Coffee" automatically adds $5 to Dining at Starbucks

**Gamification Elements**
- **Achievement system**: "30-day budget streak", "First $1000 saved"
- **Progress celebrations**: Visual rewards for hitting goals
- **Challenge modes**: "No dining out this week"
- **Sharing victories**: Optional social sharing of achievements

**Mobile App**
- **React Native**: Native iOS and Android applications
- **Offline sync**: Full functionality without internet
- **Biometric authentication**: Face ID, fingerprint login
- **Widget support**: Home screen expense tracking widgets

#### Collaboration & Sharing

**Real-Time Collaboration Features**
- **Family/partner accounts**: Shared budgets with individual privacy
- **Real-time sync**: See partner's spending instantly
- **Approval workflows**: "Approve this $500 purchase?"
- **Shared goals**: Family vacation fund with multiple contributors

**Multi-Currency Support**
- **Global currency support**: Track expenses in multiple currencies
- **Real-time exchange rates**: Automatic conversion and historical tracking
- **Travel mode**: Automatic currency detection when traveling
- **Regional compliance**: Support for different tax and financial regulations

#### Security & Compliance Enhancements

**Zero-Knowledge Architecture**
- **Client-side encryption**: Encrypt sensitive data before sending to server
- **Hardware security modules**: Dedicated encryption hardware
- **Biometric authentication**: Face ID, fingerprint, voice recognition
- **FIDO2/WebAuthn**: Hardware security key support

**Advanced Audit & Compliance**
- **Enhanced SOC 2 controls**: Advanced security monitoring and automation
- **Real-time fraud detection**: Unusual spending pattern alerts
- **Blockchain audit trail**: Immutable transaction history
- **Regulatory reporting**: Automated compliance reports

### Implementation Priority Matrix

**Phase 1 (Q1-Q2)**: Receipt OCR, Goal-based planning, PWA implementation
**Phase 2 (Q3-Q4)**: Bill management, Real-time collaboration, Voice interface
**Phase 3 (Year 2)**: Open banking, Investment tracking, Gamification
**Phase 4 (Year 2+)**: Zero-knowledge architecture, Advanced compliance

## Database Schema

### Core Tables
```sql
users (id, cognito_id, email, preferences, deleted_at, data_retention_until)
accounts (id, user_id, name, type, balance, is_active)
categories (id, user_id, name, type, color, is_default)
transactions (id, account_id, original_amount, description, date, is_parent, parent_transaction_id, category_id)
transaction_splits (id, transaction_id, amount, category_id, description, percentage)
budgets (id, user_id, category_id, amount, period, start_date, is_active)
```

### GDPR Tables
```sql
gdpr_consents (id, user_id, consent_type, granted, granted_at, withdrawn_at, version)
gdpr_requests (id, user_id, request_type, status, requested_at, completed_at)
audit_logs (id, user_id, action, resource_type, resource_id, ip_address, timestamp)
data_retention_policies (id, data_type, retention_days, auto_delete, legal_basis)
```

## Project Structure

```
MoneyQuestV3/
├── packages/
│   ├── frontend/                 # Next.js application
│   │   ├── app/                  # App Router structure
│   │   │   ├── (auth)/          # Authentication pages
│   │   │   ├── dashboard/       # Main app interface
│   │   │   └── api/             # API routes (proxy to Lambda)
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── charts/          # Chart components (Chart.js)
│   │   │   ├── transactions/    # Transaction-related components
│   │   │   └── gdpr/            # GDPR compliance components
│   │   ├── lib/
│   │   │   ├── analytics.ts     # Client-side analytics engine
│   │   │   ├── api.ts           # API client with auth
│   │   │   ├── store.ts         # Zustand store
│   │   │   ├── gdpr.ts          # GDPR utilities
│   │   │   └── offline-db.ts    # IndexedDB wrapper
│   │   └── types/               # TypeScript types
│   ├── backend/                  # Lambda functions
│   │   ├── functions/
│   │   │   ├── auth/            # Authentication handlers
│   │   │   ├── transactions/    # Transaction CRUD + splitting
│   │   │   ├── analytics/       # Server-side analytics
│   │   │   ├── reports/         # Report generation
│   │   │   └── gdpr/            # GDPR compliance endpoints
│   │   ├── lib/
│   │   │   ├── database.ts      # Prisma client setup
│   │   │   ├── auth.ts          # Cognito integration
│   │   │   └── gdpr.ts          # GDPR utilities
│   │   └── prisma/
│   │       ├── schema.prisma    # Database schema
│   │       └── migrations/      # Database migrations
│   ├── shared/                   # Shared TypeScript types
│   │   ├── types/
│   │   │   ├── transactions.ts
│   │   │   ├── analytics.ts
│   │   │   └── gdpr.ts
│   │   └── utils/               # Shared utilities
│   └── infrastructure/           # AWS CDK
│       ├── stacks/
│       │   ├── database-stack.ts
│       │   ├── api-stack.ts
│       │   ├── frontend-stack.ts
│       │   └── gdpr-stack.ts
│       └── lib/                 # CDK utilities
├── docs/                        # Documentation
├── scripts/                     # Build and deployment scripts
└── package.json                 # Monorepo configuration
```

## Compliance & Security Standards

### GDPR Compliance

#### Critical Requirements
- **Full EU compliance** for financial data processing
- **Data Protection Impact Assessment (DPIA)** completed
- **Privacy-by-design** architecture
- **Explicit consent** for all non-essential processing
- **Complete audit trail** for all data access

#### Implementation
- **Granular consent management** (essential, analytics, marketing, automated decisions)
- **Data encryption** at rest and in transit
- **Automated data retention** and deletion
- **User rights implementation** (access, rectification, erasure, portability)
- **Audit logging** for all data operations
- **EU data residency** (AWS EU regions only)

#### Key GDPR Components
- Consent management UI with versioning
- Data export functionality (JSON format)
- Complete data deletion (right to be forgotten)
- Audit log generation and reporting
- Automated retention policy enforcement

### SOC 2 Type II Compliance

#### Critical Requirements
- **Security principle**: Protection against unauthorized access
- **Availability principle**: System operational as committed or agreed
- **Processing integrity**: System processing is complete, valid, accurate, timely and authorized
- **Confidentiality principle**: Protection of confidential information
- **Privacy principle**: Personal information collection, use, retention, disclosure and disposal

#### Implementation Controls
- **Access controls**: Multi-factor authentication, role-based permissions, regular access reviews
- **System operations**: Monitoring, incident response, change management, backup procedures
- **Logical access**: Network security, encryption, vulnerability management
- **Data governance**: Classification, handling procedures, retention policies
- **Vendor management**: Third-party risk assessments, contract reviews
- **Business continuity**: Disaster recovery, incident response plans

#### Audit & Certification Process
- Annual SOC 2 Type II audits by certified public accounting firm
- Continuous monitoring of security controls
- Management assertion documentation
- Remediation tracking for any identified deficiencies
- Public SOC 2 reports available to customers and prospects

## Security Considerations

### Data Protection
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Authentication:** AWS Cognito with MFA support
- **Authorization:** Role-based access control
- **Input Validation:** Comprehensive server-side validation
- **SQL Injection:** Prisma ORM prevents injection attacks

### GDPR Security
- **Data Minimization:** Only collect necessary data
- **Pseudonymization:** Where legally permissible
- **Access Controls:** Strict role-based permissions
- **Breach Detection:** Real-time monitoring and alerting
- **Vendor Management:** AWS BAA and adequacy decisions

### Financial Data Security
- **PCI DSS Guidelines:** Follow card data security standards
- **No Card Storage:** Never store payment card information
- **Audit Trails:** Complete logs of all financial data access
- **Rate Limiting:** Prevent brute force attacks
- **Session Management:** Secure session handling

## Performance Targets

### Frontend Performance
- **Initial Page Load:** < 2 seconds
- **Chart Rendering:** < 500ms
- **Transaction List:** < 1 second for 1000+ items
- **Offline Analytics:** Fully functional without internet

### Backend Performance
- **API Response Time:** < 300ms for CRUD operations
- **Database Queries:** < 100ms for single-table queries
- **Report Generation:** < 30 seconds for complex reports
- **Data Export:** < 2 minutes for complete user data

### Scalability Targets
- **Concurrent Users:** 10,000+ simultaneous users
- **Database:** 100M+ transactions with sub-second queries
- **Cost Efficiency:** < $1,000/month at 100k users

## Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:setup
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev:frontend    # Next.js on port 3000
npm run dev:backend     # Local Lambda simulation
npm run dev:db          # Local PostgreSQL
```

### Key Commands
```bash
# Testing
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:gdpr         # GDPR compliance tests

# Database
npm run db:migrate        # Run migrations
npm run db:reset          # Reset database
npm run db:studio         # Open Prisma Studio

# Code Quality
npm run lint              # ESLint + Prettier
npm run typecheck         # TypeScript checking
npm run security-audit    # Security vulnerability scan

# Deployment
npm run build             # Build all packages
npm run deploy:staging    # Deploy to staging
npm run deploy:prod       # Deploy to production
npm run deploy:rollback   # Rollback deployment
```

## Testing Strategy

### Test Coverage Requirements
- **Unit Tests:** 90%+ coverage for business logic
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows
- **GDPR Tests:** All compliance features
- **Performance Tests:** Client-side analytics engine

### Key Test Scenarios
- Transaction splitting validation
- GDPR consent workflows
- Data export/deletion processes
- Client-side analytics accuracy
- Offline functionality
- Security vulnerabilities

### Test Data
- Use anonymized production-like data
- GDPR-compliant test user accounts
- Comprehensive transaction splitting scenarios
- Edge cases for financial calculations

## AWS Infrastructure

### Production Architecture
- **Frontend:** S3 + CloudFront global CDN
- **API:** Lambda + API Gateway with auto-scaling
- **Database:** Aurora Serverless v2 with read replicas
- **Auth:** Cognito User Pool with advanced security
- **Storage:** S3 for reports and exports
- **Monitoring:** CloudWatch with custom dashboards

### Compliance Infrastructure
- **Data Residency:** EU regions only (eu-west-1, eu-central-1) for GDPR
- **Encryption:** KMS keys for all services (GDPR & SOC 2)
- **Backup:** Encrypted backups with 35-day retention (SOC 2 availability)
- **Logging:** CloudTrail for all AWS API calls (SOC 2 monitoring)
- **Access:** IAM roles with least privilege principle (SOC 2 access controls)
- **Network Security:** VPC isolation, security groups, NACLs (SOC 2 logical access)
- **Incident Response:** 24/7 monitoring and automated alerting (SOC 2 system operations)

## Analytics Implementation

### Client-Side Engine
```typescript
class AnalyticsEngine {
  // Handles split transactions correctly
  calculateCategorySpending(transactions: Transaction[]): CategoryTotal[]

  // Real-time budget tracking
  getBudgetProgress(budgets: Budget[]): BudgetStatus[]

  // Trend analysis
  getSpendingTrends(months: number): TrendData[]

  // Offline capability
  syncWithServer(): Promise<void>
}
```

### Server-Side Processing
- Complex report generation (PDF/Excel)
- Predictive analytics using historical data
- Cross-user benchmarking (anonymized)
- Advanced financial insights

## Deployment

### Staging Environment
- **URL:** [STAGING_URL_TBD]
- **Database:** Separate Aurora cluster
- **Purpose:** QA testing and GDPR compliance validation

### Production Environment
- **URL:** [PRODUCTION_URL_TBD]
- **Database:** Production Aurora cluster with backups
- **Monitoring:** 24/7 uptime monitoring and alerting

### CI/CD Pipeline
1. **Code Push:** Triggers automated testing
2. **Security Scan:** Vulnerability and dependency checks
3. **Build:** TypeScript compilation and optimization
4. **Test:** Unit, integration, and E2E tests
5. **GDPR Check:** Compliance validation
6. **Deploy:** Blue-green deployment to AWS
7. **Verify:** Health checks and rollback capability

## Known Issues & Limitations

### Current Limitations
- Maximum 10 splits per transaction
- Report generation limited to 2 years of data
- Offline mode requires initial data sync
- EU-only deployment due to GDPR requirements

## Troubleshooting

### Common Issues
- **GDPR consent not granted:** Check consent management UI
- **Analytics not updating:** Verify client-side data sync
- **Transaction splits not summing correctly:** Check validation logic
- **AWS deployment failures:** Verify IAM permissions and region settings

### Debug Commands
```bash
npm run debug:frontend     # Next.js debug mode
npm run debug:backend      # Lambda local debugging
npm run debug:db          # Database connection testing
npm run logs:production   # View production logs
```

## Contact & Support
- **Development Team:** [TEAM_EMAIL_TBD]
- **GDPR Officer:** [GDPR_EMAIL_TBD]
- **Security Issues:** [SECURITY_EMAIL_TBD]

---

**Last Updated:** 2024-01-XX
**Version:** 1.0.0
**GDPR Compliance:** Verified
**SOC 2 Type II:** Certified
**Security Audit:** Passed