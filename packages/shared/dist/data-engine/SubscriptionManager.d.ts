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
export declare class SubscriptionManager {
    private subscription;
    constructor(subscription: SubscriptionStatus);
    getTier(): SubscriptionTier;
    isActive(): boolean;
    /**
     * Multi-user collaboration (Plus & Premium only)
     */
    canUseMultiUser(): boolean;
    /**
     * OCR receipt processing (Plus & Premium only)
     */
    canUseOCR(): boolean;
    /**
     * Automatic bank connections (Premium only)
     */
    canConnectBanks(): boolean;
    /**
     * Advanced automation & rules (Premium only)
     */
    canUseAutomation(): boolean;
    /**
     * Professional integrations - QuickBooks, TurboTax (Premium only)
     */
    canExportToQuickBooks(): boolean;
    /**
     * Priority sync & support (Plus & Premium)
     */
    canUsePrioritySupport(): boolean;
    /**
     * All users can manually track investments
     */
    canTrackInvestmentsManually(): boolean;
    /**
     * Automatic investment sync with brokerages (Premium only)
     */
    canAutoConnectInvestments(): boolean;
    getAccountLimit(): number;
    getUserLimit(): number;
    getBankConnectionLimit(): number;
    getOCRLimit(): number;
    getFeatureLimits(): FeatureLimits;
    updateSubscription(subscription: SubscriptionStatus): void;
    getSubscriptionStatus(): SubscriptionStatus;
    isTrialing(): boolean;
    isPastDue(): boolean;
    daysUntilExpiry(): number | null;
    getUpgradeMessage(feature: string): string;
    shouldShowUpgradePrompt(feature: string): boolean;
    getMonthlyRevenue(): number;
    getEstimatedCosts(): number;
    getGrossMargin(): number;
}
export declare function createFreeSubscription(): SubscriptionStatus;
export declare function createPlusSubscription(stripeSubscriptionId: string, expiresAt: Date): SubscriptionStatus;
export declare function createPremiumSubscription(stripeSubscriptionId: string, expiresAt: Date): SubscriptionStatus;
//# sourceMappingURL=SubscriptionManager.d.ts.map