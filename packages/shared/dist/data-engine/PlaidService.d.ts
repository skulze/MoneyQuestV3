/**
 * PlaidService - Bank account integration (Premium feature)
 *
 * Handles automatic bank connections and transaction sync
 * Available only for Premium ($9.99/month) users
 */
export interface PlaidInstitution {
    institution_id: string;
    name: string;
    country_codes: string[];
    products: string[];
    logo?: string;
}
export interface PlaidAccount {
    account_id: string;
    name: string;
    type: 'depository' | 'credit' | 'loan' | 'investment';
    subtype: 'checking' | 'savings' | 'credit card' | 'mortgage' | 'auto' | 'student';
    balance: {
        available: number | null;
        current: number;
        limit: number | null;
    };
    mask: string;
}
export interface PlaidTransaction {
    transaction_id: string;
    account_id: string;
    amount: number;
    date: Date;
    name: string;
    merchant_name?: string;
    category?: string[];
    pending: boolean;
    iso_currency_code?: string;
}
export interface PlaidLinkResult {
    public_token: string;
    accounts: PlaidAccount[];
    institution: PlaidInstitution;
}
export interface PlaidConnectionStatus {
    item_id: string;
    institution_name: string;
    accounts: PlaidAccount[];
    last_successful_update: Date;
    status: 'healthy' | 'degraded' | 'down';
    error?: PlaidError;
}
export interface PlaidError {
    error_type: string;
    error_code: string;
    display_message: string;
    request_id: string;
}
export declare class PlaidService {
    private static readonly API_ENDPOINT;
    private static readonly WEBHOOK_URL;
    /**
     * Initialize Plaid Link for bank connection
     * Returns public token that needs to be exchanged for access token
     */
    static initializeLink(userId: string): Promise<{
        link_token: string;
        expiration: Date;
    }>;
    /**
     * Connect bank account using Plaid Link
     * Called after user completes Plaid Link flow
     */
    static connect(linkResult: PlaidLinkResult): Promise<PlaidConnectionStatus>;
    /**
     * Sync transactions from all connected banks
     */
    static syncTransactions(userId: string): Promise<{
        new_transactions: PlaidTransaction[];
        modified_transactions: PlaidTransaction[];
        removed_transactions: string[];
    }>;
    /**
     * Get all connected bank accounts
     */
    static getConnectedAccounts(userId: string): Promise<PlaidConnectionStatus[]>;
    /**
     * Disconnect bank account
     */
    static disconnect(itemId: string): Promise<void>;
    /**
     * Handle Plaid webhooks (called by backend)
     */
    static handleWebhook(webhookData: any): Promise<void>;
    /**
     * Search for banks by name
     */
    static searchInstitutions(query: string): Promise<PlaidInstitution[]>;
    /**
     * Get popular/featured banks
     */
    static getPopularInstitutions(): Promise<PlaidInstitution[]>;
    private static handleTransactionWebhook;
    private static handleItemWebhook;
    private static handleErrorWebhook;
    /**
     * Check if Plaid is configured and available
     */
    static isConfigured(): boolean;
    /**
     * Get Plaid environment (sandbox, development, production)
     */
    static getEnvironment(): 'sandbox' | 'development' | 'production';
    /**
     * Map Plaid categories to app categories
     */
    static mapPlaidCategory(plaidCategories: string[]): string;
}
//# sourceMappingURL=PlaidService.d.ts.map