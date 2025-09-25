# MoneyQuestV3 - Personal Finance App

## Project Overview
Local-first personal finance app with 3-tier freemium model. Built with Next.js PWA architecture, IndexedDB for local storage, and session-based encrypted cloud backup.

**Core Architecture:**
- **Local-first**: 99% of operations happen offline with instant performance
- **Privacy-focused**: User data stays on device, encrypted backups only
- **Cross-platform**: Progressive Web App (PWA) - Web + Mobile via "Add to Home Screen"
- **Freemium**: Free (single-user) → Plus ($2.99, multi-user + OCR) → Premium ($9.99, bank automation)
- **Zero App Store Fees**: PWA architecture saves 30% commission on all subscriptions

## Architecture & Tech Stack

### Frontend (PWA Architecture)
- **Progressive Web App**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **Mobile Experience**: Responsive web design + "Add to Home Screen" functionality
- **Local Database**: IndexedDB (universal - works on all platforms)
- **Analytics**: Chart.js + Recharts (responsive charts for all devices)
- **Reports**: jsPDF, SheetJS (client-side generation)
- **PWA Features**: Service workers, offline support, app-like experience

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
- PWA mobile experience with offline sync

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

**Unit Economics (PWA Advantage):**
- Plus: $2.99 revenue - $0.30 costs = $2.69 profit (90% margin vs 63% with App Store)
- Premium: $9.99 revenue - $1.45 costs = $8.54 profit (85% margin vs 59% with App Store)
- **Annual savings**: $10,000-30,000 in App Store fees with 1,000 users
- Target: 75% Free, 15% Plus, 10% Premium

## PWA Strategy & Benefits

### **Why PWA Over Native Apps**
- **Zero App Store Fees**: Save 30% commission on all subscriptions
- **Instant Deployment**: No app store approval process
- **Universal Compatibility**: Works on all platforms (iOS, Android, Desktop)
- **Reduced Development Cost**: Single codebase for all platforms
- **Privacy Advantage**: No app store tracking or data requirements

### **PWA Implementation Features**
- **Add to Home Screen**: Native app-like icon and experience
- **Offline Functionality**: Full local-first operation without internet
- **Service Workers**: Background sync and caching for performance
- **Web Push Notifications**: Cross-platform notification system
- **Responsive Design**: Mobile-first UI optimized for touch interactions
- **App-Like Navigation**: Native-feeling navigation and transitions

### **Target User Behavior**
- Users discover via web search or social sharing
- Try the app instantly (no download required)
- Add to home screen when they find value
- Experience feels native but maintains web flexibility
- Share specific features via URLs (viral growth potential)

## Development Setup

### Environment Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:setup && npm run db:migrate && npm run db:seed

# Start development servers (foreground mode - recommended)
npm run dev            # Starts both website + backend with live output
                       # Website: http://localhost:3000 (Next.js 15.5.4)
                       # Backend: http://localhost:8080 (tsx watch mode)
                       # Use Ctrl+C to stop both servers cleanly
```

### Development Best Practices
**RECOMMENDED: Run servers in foreground mode for optimal process management:**
- **Clean shutdown**: `Ctrl+C` stops all processes gracefully
- **Live feedback**: See real-time output from both servers
- **No orphaned processes**: Proper parent-child process relationships
- **Resource efficiency**: Single controlled session

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
│   ├── website/              # Next.js PWA application (universal - web + mobile)
│   ├── backend/              # Lambda functions
│   ├── shared/               # Shared TypeScript types
│   └── infrastructure/       # AWS CDK
├── archived/
│   └── mobile/               # Archived React Native package (PWA replaced this)
├── docs/                     # Documentation
├── scripts/                  # Build and deployment scripts
└── .github/workflows/        # CI/CD pipelines
```

## Local-First Data Engine

```typescript
class LocalDataEngine {
  localDB: IndexedDB // Universal: IndexedDB for PWA (web + mobile)
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

### Performance Targets (PWA)
- **Initial Load**: < 2 seconds (all devices)
- **Add to Home Screen**: < 1 second app-like experience
- **Local Operations**: Instant (no API calls for daily use)
- **Report Generation**: Instant (client-side generation)
- **Session Backup**: < 5 seconds
- **Multi-device Sync**: Within hours
- **Offline Mode**: Full functionality without internet

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
- PWA installation requires user education ("Add to Home Screen")
- iOS Safari has limited PWA notification support

---
**Status**: Development Phase | **Architecture**: Local-First | **Target**: 10k users, $12k+ monthly profit

# Development Environment & Process Management

## Hot Reload Development (Recommended)
**KEEP SERVERS RUNNING for optimal development workflow:**
- **Hot reload**: Code changes automatically refresh the browser
- **Live updates**: Edit files and see changes instantly without restart
- **API testing**: Backend stays available at http://localhost:8080
- **Continuous development**: Modern stack optimized for live coding

**Current development servers support:**
- **Website**: Next.js 15 with hot reload (http://localhost:3000)
- **Backend**: tsx watch mode with auto-restart (http://localhost:8080)

## When to Restart Development Servers

### ✅ Keep Running (No Restart Needed)
- Code changes in components, pages, API routes
- CSS/styling updates
- Adding new files
- Most configuration changes

### 🔄 Restart Required
- Installing new dependencies (`npm install`)
- Environment variable changes (.env files)
- Next.js config changes (next.config.js)
- TypeScript config changes (tsconfig.json)
- Package.json script changes

## Development Environment
**Primary Development Platform: Windows 10/11 with Git Bash**
- **ALWAYS use Git Bash commands**: `rm -rf`, `ps aux`, `find`, `grep` (Unix-style file operations)
- **Process management**: Use Windows commands that work in Git Bash when needed
- **File operations**: Use `rm -rf .next` instead of `rmdir /s /q .next`
- **Node/npm commands work identically**: `npm run dev`, `npx playwright test`

## Process Management (When Restart is Needed)

### Graceful Server Management
**Preferred approach (in order):**

1. **Graceful shutdown first** - `Ctrl+C` in the terminal where the server is running
2. **If servers become unresponsive** - `taskkill //F //IM node.exe`
3. **Check for remaining processes** - `tasklist | findstr node` to verify cleanup

**Clean restart sequence (only when needed):**
```bash
# 1. Try graceful shutdown first (Ctrl+C in the foreground terminal)
# 2. If that fails, force kill processes
taskkill //F //IM node.exe

# 3. Verify all Node processes are gone
tasklist | findstr node

# 4. Clean up any cached artifacts if needed
rm -rf packages/website/.next/cache

# 5. Restart development servers in foreground
npm run dev
```

**Process management commands that work in Git Bash:**
- `tasklist | findstr node` - List running Node processes
- `taskkill //F //IM node.exe` - Force kill all Node processes (use double slashes in Git Bash)
- `Ctrl+C` - Graceful shutdown (always try first)

**Note**: Normal development should have ~10 Node processes running (1 concurrently + 2 npm + 1 tsx + ~6 Next.js processes). This is expected and efficient.