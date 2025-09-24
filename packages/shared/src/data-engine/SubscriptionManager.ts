/**
 * SubscriptionManager - Feature gating and subscription management
 *
 * Handles the 3-tier freemium model:
 * - Free: Single user, manual transactions, basic features
 * - Plus ($2.99/month): Multi-user, OCR, enhanced features
 * - Premium ($9.99/month): Bank connections, automation, professional features
 */

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  expiresAt?: Date;
  stripeSubscriptionId?: string;
}

export interface FeatureLimits {
  maxAccounts: number;
  maxUsers: number;
  maxBankConnections: number;
  canUseOCR: boolean;
  canUseMultiUser: boolean;
  canConnectBanks: boolean;
  canUseAutomation: boolean;
  canExportToQuickBooks: boolean;
  canUsePrioritySupport: boolean;
}

export class SubscriptionManager {
  private subscription: SubscriptionStatus;

  constructor(subscription: SubscriptionStatus) {
    this.subscription = subscription;
  }

  // ==========================================
  // Feature Gates
  // ==========================================

  getTier(): SubscriptionTier {
    return this.subscription.tier;
  }

  isActive(): boolean {
    if (this.subscription.tier === 'free') return true;

    return this.subscription.status === 'active' || this.subscription.status === 'trialing';
  }

  /**
   * Multi-user collaboration (Plus & Premium only)
   */
  canUseMultiUser(): boolean {
    return this.subscription.tier !== 'free' && this.isActive();
  }

  /**
   * OCR receipt processing (Plus & Premium only)
   */
  canUseOCR(): boolean {
    return this.subscription.tier !== 'free' && this.isActive();
  }

  /**
   * Automatic bank connections (Premium only)
   */
  canConnectBanks(): boolean {
    return this.subscription.tier === 'premium' && this.isActive();
  }

  /**
   * Advanced automation & rules (Premium only)
   */
  canUseAutomation(): boolean {
    return this.subscription.tier === 'premium' && this.isActive();
  }

  /**
   * Professional integrations - QuickBooks, TurboTax (Premium only)
   */
  canExportToQuickBooks(): boolean {
    return this.subscription.tier === 'premium' && this.isActive();
  }

  /**
   * Priority sync & support (Plus & Premium)
   */
  canUsePrioritySupport(): boolean {
    return this.subscription.tier !== 'free' && this.isActive();
  }

  /**
   * All users can manually track investments
   */
  canTrackInvestmentsManually(): boolean {
    return true;
  }

  /**
   * Automatic investment sync with brokerages (Premium only)
   */
  canAutoConnectInvestments(): boolean {
    return this.subscription.tier === 'premium' && this.isActive();
  }

  // ==========================================
  // Resource Limits
  // ==========================================

  getAccountLimit(): number {
    const limits = {
      free: 3,
      plus: 5,
      premium: 10
    };
    return limits[this.subscription.tier];
  }

  getUserLimit(): number {
    return this.subscription.tier === 'free' ? 1 : 10;
  }

  getBankConnectionLimit(): number {
    const limits = {
      free: 0,
      plus: 0,
      premium: 10
    };
    return limits[this.subscription.tier];
  }

  getOCRLimit(): number {
    const limits = {
      free: 0,
      plus: 100, // per month
      premium: 500 // per month
    };
    return limits[this.subscription.tier];
  }

  // ==========================================
  // Feature Set Summary
  // ==========================================

  getFeatureLimits(): FeatureLimits {
    return {
      maxAccounts: this.getAccountLimit(),
      maxUsers: this.getUserLimit(),
      maxBankConnections: this.getBankConnectionLimit(),
      canUseOCR: this.canUseOCR(),
      canUseMultiUser: this.canUseMultiUser(),
      canConnectBanks: this.canConnectBanks(),
      canUseAutomation: this.canUseAutomation(),
      canExportToQuickBooks: this.canExportToQuickBooks(),
      canUsePrioritySupport: this.canUsePrioritySupport(),
    };
  }

  // ==========================================
  // Subscription Management
  // ==========================================

  updateSubscription(subscription: SubscriptionStatus): void {
    this.subscription = subscription;
  }

  getSubscriptionStatus(): SubscriptionStatus {
    return { ...this.subscription };
  }

  isTrialing(): boolean {
    return this.subscription.status === 'trialing';
  }

  isPastDue(): boolean {
    return this.subscription.status === 'past_due';
  }

  daysUntilExpiry(): number | null {
    if (!this.subscription.expiresAt) return null;

    const now = new Date();
    const expiry = new Date(this.subscription.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // ==========================================
  // Upgrade Prompts & Conversion Tracking
  // ==========================================

  getUpgradeMessage(feature: string): string {
    switch (feature) {
      case 'multi_user':
        return 'Add family members and collaborate on budgets with Plus ($2.99/month)';
      case 'ocr':
        return 'Snap photos of receipts and auto-import transactions with Plus ($2.99/month)';
      case 'bank_connections':
        return 'Connect your bank accounts for automatic transaction sync with Premium ($9.99/month)';
      case 'automation':
        return 'Set up rules and automation to categorize transactions with Premium ($9.99/month)';
      case 'quickbooks':
        return 'Export to QuickBooks and TurboTax with Premium ($9.99/month)';
      case 'account_limit':
        return `You've reached the ${this.getAccountLimit()} account limit. Upgrade to ${
          this.subscription.tier === 'free' ? 'Plus ($2.99/month)' : 'Premium ($9.99/month)'
        } for more accounts`;
      default:
        return 'Upgrade to unlock more features!';
    }
  }

  shouldShowUpgradePrompt(feature: string): boolean {
    // Logic to determine when to show upgrade prompts
    // Could be based on usage patterns, time since last prompt, etc.
    return true;
  }

  // ==========================================
  // Unit Economics Tracking
  // ==========================================

  getMonthlyRevenue(): number {
    const revenue = {
      free: 0,
      plus: 2.99,
      premium: 9.99
    };
    return revenue[this.subscription.tier];
  }

  getEstimatedCosts(): number {
    const costs = {
      free: 0,
      plus: 0.30, // OCR processing, enhanced support
      premium: 1.45 // Plaid fees, automation, integrations
    };
    return costs[this.subscription.tier];
  }

  getGrossMargin(): number {
    const revenue = this.getMonthlyRevenue();
    const costs = this.getEstimatedCosts();

    if (revenue === 0) return 0;
    return ((revenue - costs) / revenue) * 100;
  }
}

// ==========================================
// Helper Functions
// ==========================================

export function createFreeSubscription(): SubscriptionStatus {
  return {
    tier: 'free',
    status: 'active',
  };
}

export function createPlusSubscription(stripeSubscriptionId: string, expiresAt: Date): SubscriptionStatus {
  return {
    tier: 'plus',
    status: 'active',
    expiresAt,
    stripeSubscriptionId,
  };
}

export function createPremiumSubscription(stripeSubscriptionId: string, expiresAt: Date): SubscriptionStatus {
  return {
    tier: 'premium',
    status: 'active',
    expiresAt,
    stripeSubscriptionId,
  };
}