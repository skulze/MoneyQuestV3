// Export all types and schemas
export * from './types/transactions';
export * from './types/analytics';
export * from './types/gdpr';

// Export data engine components
export * from './data-engine/LocalDataEngine';
export * from './data-engine/SubscriptionManager';
export * from './data-engine/BackupService';
export * from './data-engine/OCRService';
export * from './data-engine/PlaidService';

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

// Common enums
export enum Period {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}