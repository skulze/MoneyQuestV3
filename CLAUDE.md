# MoneyQuestV3 - Personal Finance App

## Project Overview
Local-first personal finance app with 3-tier freemium model. Built with Next.js + React Native, SQLite/IndexedDB for local storage, and session-based encrypted cloud backup.

**Core Architecture:**
- **Local-first**: 99% of operations happen offline with instant performance
- **Privacy-focused**: User data stays on device, encrypted backups only
- **Cross-platform**: Web (Next.js) + Mobile (React Native + Expo)
- **Freemium**: Free (single-user) → Plus ($2.99, multi-user + OCR) → Premium ($9.99, bank automation)

## Architecture & Tech Stack

### Frontend
- **Website**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **Mobile**: React Native + TypeScript + Expo + AsyncStorage
- **Local Database**: SQLite (mobile), IndexedDB (web)
- **Analytics**: Chart.js (web), React Native Charts (mobile)
- **Reports**: jsPDF, SheetJS (client-side generation)

### Backend (Minimal)
- **Functions**: AWS Lambda + TypeScript + Function URLs
- **Auth**: Supabase Auth or NextAuth.js + MFA
- **Payments**: Stripe subscriptions
- **Storage**: S3 encrypted blob storage (session backups)
- **Bank Integration**: Plaid (Premium tier only)

### Local-First Design
**99% Local Operations:**
- All CRUD operations instant and offline
- Charts, analytics, budgets calculated locally
- PDF/Excel reports generated client-side
- Multi-currency conversions with cached rates

**1% Cloud Services:**
- User authentication
- Session-based encrypted backups (on app close/inactivity)
- Multi-device sync with conflict resolution
- Market data updates (daily/weekly)

## Pricing & Features

### 🆓 Free Tier - Single User
- Manual transaction import (CSV/OFX/QIF)
- Unlimited transaction splitting
- Analytics dashboard with charts
- Budget tracking and alerts
- Manual investment tracking
- PDF/Excel reports
- Multi-currency support
- Mobile apps with offline sync

### ➕ Plus Tier - $2.99/month
**Everything in Free plus:**
- Multi-user collaboration (family budgets)
- OCR receipt processing (photo → transaction)
- Enhanced investment charts
- Priority sync & support

### 💎 Premium Tier - $9.99/month
**Everything in Plus plus:**
- Automatic bank connections (Plaid, 10 accounts)
- Real-time transaction sync
- Automatic investment sync with brokerages
- Advanced automation & rules
- Tax optimization features
- Professional integrations (QuickBooks, TurboTax)

**Unit Economics:**
- Plus: $2.99 revenue - $0.30 costs = $2.69 profit (90% margin)
- Premium: $9.99 revenue - $1.45 costs = $8.54 profit (85% margin)
- Target: 75% Free, 15% Plus, 10% Premium

## Development Setup

### Environment Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:setup && npm run db:migrate && npm run db:seed

# Start development servers
npm run dev:website    # Next.js website on port 3000
npm run dev:mobile     # React Native Expo development server
npm run dev:backend    # Local Lambda simulation
```

### Key Commands
```bash
# Testing & Quality
npm run test           # Run all tests
npm run lint           # ESLint + Prettier
npm run typecheck      # TypeScript checking

# Database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Security
npm run security-audit # Dependency vulnerability scan

# Build & Deploy
npm run build          # Build all packages
npm run deploy:staging # Deploy to staging
npm run deploy:prod    # Deploy to production
```

## Database Schema

### Core Tables
```sql
# User Management
users (id, auth_id, email, preferences, subscription_tier, subscription_expires_at)
subscriptions (id, user_id, stripe_subscription_id, tier, status, expires_at)

# Financial Data
accounts (id, user_id, name, type, balance, currency_id, is_active)
categories (id, user_id, name, type, color, is_default)
transactions (id, account_id, amount, description, date, category_id, currency_id)
transaction_splits (id, transaction_id, amount, category_id, description)
budgets (id, user_id, category_id, amount, period, start_date, currency_id)

# Multi-Currency
currencies (id, code, name, symbol, is_active)
exchange_rates (id, from_currency_id, to_currency_id, rate, date)

# Investments (All Users - Manual Entry)
portfolios (id, user_id, name, provider, account_number, is_active)
investments (id, portfolio_id, symbol, name, quantity, cost_basis, current_price)
net_worth_snapshots (id, user_id, total_assets, total_liabilities, net_worth, date)

# Plus/Premium: Multi-User Collaboration
user_relationships (id, user_id, related_user_id, relationship_type, status)
shared_budgets (id, budget_id, owner_user_id, shared_user_id, permission_level)

# Plus/Premium: OCR Receipt Processing
ocr_receipts (id, user_id, image_url, processed_text, confidence_score, created_at)
ocr_transactions (id, ocr_receipt_id, amount, merchant, category, user_confirmed)

# Premium: Plaid Bank Integration
plaid_accounts (id, user_id, plaid_account_id, institution_name, account_type)
plaid_transactions (id, user_id, plaid_account_id, amount, date, merchant, category)

# Analytics & Conversion
payments (id, user_id, stripe_payment_intent_id, amount, status, created_at)
usage_events (id, user_id, event_type, event_data, created_at)
conversion_triggers (id, user_id, trigger_type, shown_at, converted_at)
```

## Project Structure
```
MoneyQuestV3/
├── packages/
│   ├── website/              # Next.js web application
│   ├── mobile/               # React Native mobile app
│   ├── backend/              # Lambda functions
│   ├── shared/               # Shared TypeScript types
│   └── infrastructure/       # AWS CDK
├── docs/                     # Documentation
├── scripts/                  # Build and deployment scripts
└── .github/workflows/        # CI/CD pipelines
```

## Local-First Data Engine

```typescript
class LocalDataEngine {
  localDB: SQLiteDB // Mobile: SQLite, Web: IndexedDB
  subscription: SubscriptionManager

  // Core operations (instant, local)
  addTransaction(tx: Transaction) { return this.localDB.insert(tx) }
  getTransactions(filter?: Filter) { return this.localDB.query(filter) }
  updateBudget(budget: Budget) { return this.localDB.update(budget) }

  // Analytics (100% local)
  calculateCategorySpending(): CategoryTotal[] { return this.localDB.analytics() }
  getBudgetProgress(): BudgetStatus[] { return this.localDB.budgetAnalytics() }
  generatePDFReport(): Blob { return jsPDF.generate(this.localDB.data) }

  // Session-based backup
  hasUnsyncedChanges = false
  async endSession() {
    if (this.hasUnsyncedChanges) {
      const data = this.localDB.exportAll()
      await BackupService.backup(encrypt(data))
      this.hasUnsyncedChanges = false
    }
  }

  // Feature gates
  async processReceiptOCR(imageFile: File): Promise<Transaction[]> {
    if (!this.subscription.canUseOCR()) {
      throw new UpgradeRequiredError('OCR requires Plus ($2.99/month)')
    }
    return await OCRService.processReceipt(imageFile)
  }

  async connectPlaidAccount(institution: PlaidInstitution) {
    if (!this.subscription.canConnectBanks()) {
      throw new UpgradeRequiredError('Bank connections require Premium ($9.99/month)')
    }
    return await PlaidService.connect(institution)
  }
}

class SubscriptionManager {
  constructor(private userTier: 'free' | 'plus' | 'premium') {}

  // Feature gates
  canUseMultiUser(): boolean { return this.userTier !== 'free' }
  canUseOCR(): boolean { return this.userTier !== 'free' }
  canConnectBanks(): boolean { return this.userTier === 'premium' }

  // All users can manually track investments
  canTrackInvestmentsManually(): boolean { return true }
  canAutoConnectInvestments(): boolean { return this.userTier === 'premium' }

  // Resource limits
  getAccountLimit(): number {
    return { free: 3, plus: 5, premium: 10 }[this.userTier]
  }

  getUserLimit(): number {
    return this.userTier === 'free' ? 1 : 10
  }
}
```

## Security & Performance

### Security Requirements
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Authentication**: Multi-factor authentication support
- **Input validation**: Server-side validation for all inputs
- **Database security**: Prisma ORM prevents SQL injection

### Performance Targets
- **Initial Load**: < 2 seconds (web), < 3 seconds (mobile)
- **Local Operations**: Instant (no API calls for daily use)
- **Report Generation**: Instant (client-side generation)
- **Session Backup**: < 5 seconds
- **Multi-device Sync**: Within hours

### Compliance Notes
- **GDPR basics**: User consent, data export, account deletion
- **NOT REQUIRED**: SOC 2 Type II, PCI DSS (using Stripe), AML/KYC

## Testing & Quality

### Test Coverage
- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (login, transaction splitting, budgets)

### Quality Commands
```bash
npm run test           # Run test suite
npm run lint           # Code linting
npm run typecheck      # TypeScript validation
npm run security-audit # Vulnerability scanning
```

## Known Limitations
- Maximum 10 splits per transaction
- Report generation limited to 2 years of data
- Offline mode requires initial sync (mobile)

---
**Status**: Development Phase | **Architecture**: Local-First | **Target**: 10k users, $12k+ monthly profit