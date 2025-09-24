import { z } from 'zod';
export declare const CategoryTotalSchema: z.ZodObject<{
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    totalAmount: z.ZodNumber;
    percentage: z.ZodNumber;
    transactionCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    percentage: number;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
}, {
    categoryId: string;
    percentage: number;
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
}>;
export declare const BudgetStatusSchema: z.ZodObject<{
    budgetId: z.ZodString;
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    budgetAmount: z.ZodNumber;
    spentAmount: z.ZodNumber;
    remainingAmount: z.ZodNumber;
    percentageUsed: z.ZodNumber;
    isOverBudget: z.ZodBoolean;
    period: z.ZodEnum<["monthly", "yearly"]>;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    categoryName: string;
    budgetId: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    isOverBudget: boolean;
    period: "monthly" | "yearly";
}, {
    categoryId: string;
    categoryName: string;
    budgetId: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    isOverBudget: boolean;
    period: "monthly" | "yearly";
}>;
export declare const TrendDataSchema: z.ZodObject<{
    period: z.ZodString;
    totalSpent: z.ZodNumber;
    categoryBreakdown: z.ZodArray<z.ZodObject<{
        categoryId: z.ZodString;
        categoryName: z.ZodString;
        totalAmount: z.ZodNumber;
        percentage: z.ZodNumber;
        transactionCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        percentage: number;
        categoryName: string;
        totalAmount: number;
        transactionCount: number;
    }, {
        categoryId: string;
        percentage: number;
        categoryName: string;
        totalAmount: number;
        transactionCount: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    period: string;
    totalSpent: number;
    categoryBreakdown: {
        categoryId: string;
        percentage: number;
        categoryName: string;
        totalAmount: number;
        transactionCount: number;
    }[];
}, {
    period: string;
    totalSpent: number;
    categoryBreakdown: {
        categoryId: string;
        percentage: number;
        categoryName: string;
        totalAmount: number;
        transactionCount: number;
    }[];
}>;
export declare const SpendingInsightSchema: z.ZodObject<{
    type: z.ZodEnum<["trend", "anomaly", "recommendation"]>;
    title: z.ZodString;
    description: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    severity: z.ZodEnum<["low", "medium", "high"]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: "trend" | "anomaly" | "recommendation";
    title: string;
    severity: "low" | "medium" | "high";
    categoryId?: string | undefined;
    amount?: number | undefined;
}, {
    description: string;
    type: "trend" | "anomaly" | "recommendation";
    title: string;
    severity: "low" | "medium" | "high";
    categoryId?: string | undefined;
    amount?: number | undefined;
}>;
export declare const AnalyticsRequestSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    accountIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    categoryIds?: string[] | undefined;
    accountIds?: string[] | undefined;
}, {
    startDate: string;
    endDate: string;
    categoryIds?: string[] | undefined;
    accountIds?: string[] | undefined;
}>;
export type CategoryTotal = z.infer<typeof CategoryTotalSchema>;
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;
export type TrendData = z.infer<typeof TrendDataSchema>;
export type SpendingInsight = z.infer<typeof SpendingInsightSchema>;
export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
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
//# sourceMappingURL=analytics.d.ts.map