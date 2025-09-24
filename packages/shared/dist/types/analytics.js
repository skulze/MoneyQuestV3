"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRequestSchema = exports.SpendingInsightSchema = exports.TrendDataSchema = exports.BudgetStatusSchema = exports.CategoryTotalSchema = void 0;
const zod_1 = require("zod");
// Category spending analytics
exports.CategoryTotalSchema = zod_1.z.object({
    categoryId: zod_1.z.string(),
    categoryName: zod_1.z.string(),
    totalAmount: zod_1.z.number(),
    percentage: zod_1.z.number(),
    transactionCount: zod_1.z.number(),
});
exports.BudgetStatusSchema = zod_1.z.object({
    budgetId: zod_1.z.string(),
    categoryId: zod_1.z.string(),
    categoryName: zod_1.z.string(),
    budgetAmount: zod_1.z.number(),
    spentAmount: zod_1.z.number(),
    remainingAmount: zod_1.z.number(),
    percentageUsed: zod_1.z.number(),
    isOverBudget: zod_1.z.boolean(),
    period: zod_1.z.enum(['monthly', 'yearly']),
});
exports.TrendDataSchema = zod_1.z.object({
    period: zod_1.z.string(), // ISO date string
    totalSpent: zod_1.z.number(),
    categoryBreakdown: zod_1.z.array(exports.CategoryTotalSchema),
});
exports.SpendingInsightSchema = zod_1.z.object({
    type: zod_1.z.enum(['trend', 'anomaly', 'recommendation']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    amount: zod_1.z.number().optional(),
    categoryId: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['low', 'medium', 'high']),
});
// Request schemas for analytics
exports.AnalyticsRequestSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    categoryIds: zod_1.z.array(zod_1.z.string()).optional(),
    accountIds: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=analytics.js.map