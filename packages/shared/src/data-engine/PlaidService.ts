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
  mask: string; // Last 4 digits
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

export class PlaidService {
  private static readonly API_ENDPOINT = '/api/plaid';
  private static readonly WEBHOOK_URL = '/api/webhooks/plaid';

  /**
   * Initialize Plaid Link for bank connection
   * Returns public token that needs to be exchanged for access token
   */
  static async initializeLink(userId: string): Promise<{
    link_token: string;
    expiration: Date;
  }> {
    try {
      console.log('🔗 Initializing Plaid Link...');

      // TODO: Call backend to create link_token
      const response = await fetch(`${this.API_ENDPOINT}/link/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          client_name: 'MoneyQuestV3',
          country_codes: ['US'],
          language: 'en',
          products: ['transactions'],
          webhook: this.WEBHOOK_URL,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.display_message || 'Failed to initialize Plaid Link');
      }

      return {
        link_token: data.link_token,
        expiration: new Date(data.expiration),
      };
    } catch (error) {
      console.error('❌ Plaid Link initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect bank account using Plaid Link
   * Called after user completes Plaid Link flow
   */
  static async connect(linkResult: PlaidLinkResult): Promise<PlaidConnectionStatus> {
    try {
      console.log('🏦 Connecting to bank:', linkResult.institution.name);

      // Exchange public token for access token
      const response = await fetch(`${this.API_ENDPOINT}/link/token/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: linkResult.public_token,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.display_message || 'Failed to connect bank account');
      }

      // Store connection in database
      const connection: PlaidConnectionStatus = {
        item_id: data.item_id,
        institution_name: linkResult.institution.name,
        accounts: linkResult.accounts,
        last_successful_update: new Date(),
        status: 'healthy',
      };

      console.log('✅ Bank connected successfully:', connection.institution_name);

      return connection;
    } catch (error) {
      console.error('❌ Bank connection failed:', error);
      throw error;
    }
  }

  /**
   * Sync transactions from all connected banks
   */
  static async syncTransactions(userId: string): Promise<{
    new_transactions: PlaidTransaction[];
    modified_transactions: PlaidTransaction[];
    removed_transactions: string[];
  }> {
    try {
      console.log('🔄 Syncing bank transactions...');

      const response = await fetch(`${this.API_ENDPOINT}/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.display_message || 'Failed to sync transactions');
      }

      console.log('✅ Transaction sync complete:', {
        new: data.added.length,
        modified: data.modified.length,
        removed: data.removed.length,
      });

      return {
        new_transactions: data.added,
        modified_transactions: data.modified,
        removed_transactions: data.removed,
      };
    } catch (error) {
      console.error('❌ Transaction sync failed:', error);
      throw error;
    }
  }

  /**
   * Get all connected bank accounts
   */
  static async getConnectedAccounts(userId: string): Promise<PlaidConnectionStatus[]> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/accounts?user_id=${userId}`);
      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.display_message || 'Failed to get connected accounts');
      }

      return data.connections;
    } catch (error) {
      console.error('❌ Failed to get connected accounts:', error);
      throw error;
    }
  }

  /**
   * Disconnect bank account
   */
  static async disconnect(itemId: string): Promise<void> {
    try {
      console.log('🔌 Disconnecting bank account...');

      const response = await fetch(`${this.API_ENDPOINT}/item/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
        }),
      });

      if (!response.ok) {
        const data: any = await response.json();
        throw new Error(data.error?.display_message || 'Failed to disconnect account');
      }

      console.log('✅ Bank account disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect account:', error);
      throw error;
    }
  }

  /**
   * Handle Plaid webhooks (called by backend)
   */
  static async handleWebhook(webhookData: any): Promise<void> {
    const { webhook_type, webhook_code, item_id } = webhookData;

    console.log('📡 Plaid webhook received:', { webhook_type, webhook_code, item_id });

    switch (webhook_type) {
      case 'TRANSACTIONS':
        await this.handleTransactionWebhook(webhookData);
        break;
      case 'ITEM':
        await this.handleItemWebhook(webhookData);
        break;
      case 'ERROR':
        await this.handleErrorWebhook(webhookData);
        break;
      default:
        console.log('🤷 Unknown webhook type:', webhook_type);
    }
  }

  // ==========================================
  // Institution Search
  // ==========================================

  /**
   * Search for banks by name
   */
  static async searchInstitutions(query: string): Promise<PlaidInstitution[]> {
    try {
      const response = await fetch(
        `${this.API_ENDPOINT}/institutions/search?query=${encodeURIComponent(query)}&country_codes=US`
      );
      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.display_message || 'Failed to search institutions');
      }

      return data.institutions;
    } catch (error) {
      console.error('❌ Institution search failed:', error);
      throw error;
    }
  }

  /**
   * Get popular/featured banks
   */
  static async getPopularInstitutions(): Promise<PlaidInstitution[]> {
    // Return hardcoded list of popular institutions
    return [
      {
        institution_id: 'ins_1',
        name: 'Chase',
        country_codes: ['US'],
        products: ['transactions'],
        logo: '/logos/chase.png',
      },
      {
        institution_id: 'ins_2',
        name: 'Bank of America',
        country_codes: ['US'],
        products: ['transactions'],
        logo: '/logos/bofa.png',
      },
      {
        institution_id: 'ins_3',
        name: 'Wells Fargo',
        country_codes: ['US'],
        products: ['transactions'],
        logo: '/logos/wellsfargo.png',
      },
      {
        institution_id: 'ins_4',
        name: 'Citi',
        country_codes: ['US'],
        products: ['transactions'],
        logo: '/logos/citi.png',
      },
    ];
  }

  // ==========================================
  // Private Methods - Webhook Handlers
  // ==========================================

  private static async handleTransactionWebhook(data: any): Promise<void> {
    const { webhook_code, item_id, new_transactions, removed_transactions } = data;

    switch (webhook_code) {
      case 'INITIAL_UPDATE':
        console.log('📊 Initial transaction data available');
        // Trigger full transaction sync
        break;
      case 'HISTORICAL_UPDATE':
        console.log('📚 Historical transaction data available');
        // Trigger historical sync
        break;
      case 'DEFAULT_UPDATE':
        console.log('🆕 New transactions available:', new_transactions);
        // Sync new transactions
        break;
      case 'TRANSACTIONS_REMOVED':
        console.log('🗑️  Transactions removed:', removed_transactions);
        // Remove transactions from local database
        break;
    }
  }

  private static async handleItemWebhook(data: any): Promise<void> {
    const { webhook_code, item_id, error } = data;

    switch (webhook_code) {
      case 'ERROR':
        console.error('🚨 Plaid item error:', error);
        // Update connection status to error
        // Notify user to re-authenticate
        break;
      case 'PENDING_EXPIRATION':
        console.warn('⏰ Plaid item expiring soon');
        // Notify user to update connection
        break;
      case 'USER_PERMISSION_REVOKED':
        console.warn('🚫 User revoked permissions');
        // Disable connection
        break;
    }
  }

  private static async handleErrorWebhook(data: any): Promise<void> {
    console.error('🚨 Plaid error webhook:', data);
    // Log error for monitoring
    // Update connection status
  }

  // ==========================================
  // Utilities
  // ==========================================

  /**
   * Check if Plaid is configured and available
   */
  static isConfigured(): boolean {
    // Check if Plaid credentials are configured
    return process.env.PLAID_CLIENT_ID !== undefined;
  }

  /**
   * Get Plaid environment (sandbox, development, production)
   */
  static getEnvironment(): 'sandbox' | 'development' | 'production' {
    return (process.env.PLAID_ENV as any) || 'sandbox';
  }

  /**
   * Map Plaid categories to app categories
   */
  static mapPlaidCategory(plaidCategories: string[]): string {
    if (!plaidCategories || plaidCategories.length === 0) return 'other';

    const primaryCategory = plaidCategories[0].toLowerCase();

    const categoryMap: Record<string, string> = {
      'food and drink': 'dining',
      'shops': 'shopping',
      'transportation': 'transportation',
      'entertainment': 'entertainment',
      'healthcare': 'healthcare',
      'service': 'services',
      'transfer': 'transfer',
      'deposit': 'income',
      'payroll': 'income',
    };

    return categoryMap[primaryCategory] || 'other';
  }
}