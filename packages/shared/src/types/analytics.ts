import { z } from 'zod';

// Category spending analytics
export const CategoryTotalSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  totalAmount: z.number(),
  percentage: z.number(),
  transactionCount: z.number(),
});

export const BudgetStatusSchema = z.object({
  budgetId: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  budgetAmount: z.number(),
  spentAmount: z.number(),
  remainingAmount: z.number(),
  percentageUsed: z.number(),
  isOverBudget: z.boolean(),
  period: z.enum(['monthly', 'yearly']),
});

export const TrendDataSchema = z.object({
  period: z.string(), // ISO date string
  totalSpent: z.number(),
  categoryBreakdown: z.array(CategoryTotalSchema),
});

export const SpendingInsightSchema = z.object({
  type: z.enum(['trend', 'anomaly', 'recommendation']),
  title: z.string(),
  description: z.string(),
  amount: z.number().optional(),
  categoryId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']),
});

// Request schemas for analytics
export const AnalyticsRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  categoryIds: z.array(z.string()).optional(),
  accountIds: z.array(z.string()).optional(),
});

// Type exports
export type CategoryTotal = z.infer<typeof CategoryTotalSchema>;
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;
export type TrendData = z.infer<typeof TrendDataSchema>;
export type SpendingInsight = z.infer<typeof SpendingInsightSchema>;
export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;

// Response types
export interface MonthlyAnalytics {
  month: string;
  totalSpent: number;
  categoryTotals: CategoryTotal[];
  budgetStatuses: BudgetStatus[];
  insights: SpendingInsight[];
}

export interface SpendingTrends {
  trends: TrendData[];
  insights: SpendingInsight[];
  projections?: {
    nextMonth: number;
    yearEnd: number;
  };
}