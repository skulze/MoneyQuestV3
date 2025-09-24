"use strict";
/**
 * SubscriptionManager - Feature gating and subscription management
 *
 * Handles the 3-tier freemium model:
 * - Free: Single user, manual transactions, basic features
 * - Plus ($2.99/month): Multi-user, OCR, enhanced features
 * - Premium ($9.99/month): Bank connections, automation, professional features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionManager = void 0;
exports.createFreeSubscription = createFreeSubscription;
exports.createPlusSubscription = createPlusSubscription;
exports.createPremiumSubscription = createPremiumSubscription;
class SubscriptionManager {
    constructor(subscription) {
        this.subscription = subscription;
    }
    // ==========================================
    // Feature Gates
    // ==========================================
    getTier() {
        return this.subscription.tier;
    }
    isActive() {
        if (this.subscription.tier === 'free')
            return true;
        return this.subscription.status === 'active' || this.subscription.status === 'trialing';
    }
    /**
     * Multi-user collaboration (Plus & Premium only)
     */
    canUseMultiUser() {
        return this.subscription.tier !== 'free' && this.isActive();
    }
    /**
     * OCR receipt processing (Plus & Premium only)
     */
    canUseOCR() {
        return this.subscription.tier !== 'free' && this.isActive();
    }
    /**
     * Automatic bank connections (Premium only)
     */
    canConnectBanks() {
        return this.subscription.tier === 'premium' && this.isActive();
    }
    /**
     * Advanced automation & rules (Premium only)
     */
    canUseAutomation() {
        return this.subscription.tier === 'premium' && this.isActive();
    }
    /**
     * Professional integrations - QuickBooks, TurboTax (Premium only)
     */
    canExportToQuickBooks() {
        return this.subscription.tier === 'premium' && this.isActive();
    }
    /**
     * Priority sync & support (Plus & Premium)
     */
    canUsePrioritySupport() {
        return this.subscription.tier !== 'free' && this.isActive();
    }
    /**
     * All users can manually track investments
     */
    canTrackInvestmentsManually() {
        return true;
    }
    /**
     * Automatic investment sync with brokerages (Premium only)
     */
    canAutoConnectInvestments() {
        return this.subscription.tier === 'premium' && this.isActive();
    }
    // ==========================================
    // Resource Limits
    // ==========================================
    getAccountLimit() {
        const limits = {
            free: 3,
            plus: 5,
            premium: 10
        };
        return limits[this.subscription.tier];
    }
    getUserLimit() {
        return this.subscription.tier === 'free' ? 1 : 10;
    }
    getBankConnectionLimit() {
        const limits = {
            free: 0,
            plus: 0,
            premium: 10
        };
        return limits[this.subscription.tier];
    }
    getOCRLimit() {
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
    getFeatureLimits() {
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
    updateSubscription(subscription) {
        this.subscription = subscription;
    }
    getSubscriptionStatus() {
        return { ...this.subscription };
    }
    isTrialing() {
        return this.subscription.status === 'trialing';
    }
    isPastDue() {
        return this.subscription.status === 'past_due';
    }
    daysUntilExpiry() {
        if (!this.subscription.expiresAt)
            return null;
        const now = new Date();
        const expiry = new Date(this.subscription.expiresAt);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    // ==========================================
    // Upgrade Prompts & Conversion Tracking
    // ==========================================
    getUpgradeMessage(feature) {
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
                return `You've reached the ${this.getAccountLimit()} account limit. Upgrade to ${this.subscription.tier === 'free' ? 'Plus ($2.99/month)' : 'Premium ($9.99/month)'} for more accounts`;
            default:
                return 'Upgrade to unlock more features!';
        }
    }
    shouldShowUpgradePrompt(feature) {
        // Logic to determine when to show upgrade prompts
        // Could be based on usage patterns, time since last prompt, etc.
        return true;
    }
    // ==========================================
    // Unit Economics Tracking
    // ==========================================
    getMonthlyRevenue() {
        const revenue = {
            free: 0,
            plus: 2.99,
            premium: 9.99
        };
        return revenue[this.subscription.tier];
    }
    getEstimatedCosts() {
        const costs = {
            free: 0,
            plus: 0.30, // OCR processing, enhanced support
            premium: 1.45 // Plaid fees, automation, integrations
        };
        return costs[this.subscription.tier];
    }
    getGrossMargin() {
        const revenue = this.getMonthlyRevenue();
        const costs = this.getEstimatedCosts();
        if (revenue === 0)
            return 0;
        return ((revenue - costs) / revenue) * 100;
    }
}
exports.SubscriptionManager = SubscriptionManager;
// ==========================================
// Helper Functions
// ==========================================
function createFreeSubscription() {
    return {
        tier: 'free',
        status: 'active',
    };
}
function createPlusSubscription(stripeSubscriptionId, expiresAt) {
    return {
        tier: 'plus',
        status: 'active',
        expiresAt,
        stripeSubscriptionId,
    };
}
function createPremiumSubscription(stripeSubscriptionId, expiresAt) {
    return {
        tier: 'premium',
        status: 'active',
        expiresAt,
        stripeSubscriptionId,
    };
}
//# sourceMappingURL=SubscriptionManager.js.map