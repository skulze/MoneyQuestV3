import { z } from 'zod';

// Base Transaction Schema
export const TransactionSchema = z.object({
  id: z.string(),
  originalAmount: z.number().positive(),
  description: z.string().min(1),
  isParent: z.boolean(),
  date: z.date(),
  categoryId: z.string().optional(),
  accountId: z.string(),
});

export const TransactionSplitSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  amount: z.number().positive(),
  categoryId: z.string(),
  percentage: z.number().min(0).max(100),
  description: z.string().optional(),
});

// Create Transaction Request Schema
export const CreateTransactionSchema = z.object({
  accountId: z.string(),
  originalAmount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().datetime(),
  categoryId: z.string().optional(),
  splits: z.array(z.object({
    amount: z.number().positive(),
    categoryId: z.string(),
    description: z.string().optional(),
  })).optional(),
});

// Update Transaction Request Schema
export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend({
  id: z.string(),
});

// Transaction Split Request Schema
export const CreateTransactionSplitSchema = z.object({
  transactionId: z.string(),
  splits: z.array(z.object({
    amount: z.number().positive(),
    categoryId: z.string(),
    description: z.string().optional(),
  })).min(2), // Must have at least 2 splits
});

// Type exports
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionSchema>;
export type CreateTransactionSplitRequest = z.infer<typeof CreateTransactionSplitSchema>;

// Response types
export interface TransactionWithSplits extends Transaction {
  splits?: TransactionSplit[];
}

export interface GetTransactionsResponse {
  transactions: TransactionWithSplits[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}