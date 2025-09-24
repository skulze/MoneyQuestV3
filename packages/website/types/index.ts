// Core transaction types based on CLAUDE.md specifications
export interface Transaction {
  id: string;
  originalAmount: number;
  description: string;
  isParent: boolean;
  date: Date;
  categoryId?: string;
  splits?: TransactionSplit[];
}

export interface TransactionSplit {
  id: string;
  transactionId: string;
  amount: number;
  categoryId: string;
  percentage: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  cognitoId: string;
  email: string;
  preferences: Record<string, any>;
}