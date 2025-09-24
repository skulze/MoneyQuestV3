"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionSplitSchema = exports.UpdateTransactionSchema = exports.CreateTransactionSchema = exports.TransactionSplitSchema = exports.TransactionSchema = void 0;
const zod_1 = require("zod");
// Base Transaction Schema
exports.TransactionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    originalAmount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(1),
    isParent: zod_1.z.boolean(),
    date: zod_1.z.date(),
    categoryId: zod_1.z.string().optional(),
    accountId: zod_1.z.string(),
});
exports.TransactionSplitSchema = zod_1.z.object({
    id: zod_1.z.string(),
    transactionId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    categoryId: zod_1.z.string(),
    percentage: zod_1.z.number().min(0).max(100),
    description: zod_1.z.string().optional(),
});
// Create Transaction Request Schema
exports.CreateTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    originalAmount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(1),
    date: zod_1.z.string().datetime(),
    categoryId: zod_1.z.string().optional(),
    splits: zod_1.z.array(zod_1.z.object({
        amount: zod_1.z.number().positive(),
        categoryId: zod_1.z.string(),
        description: zod_1.z.string().optional(),
    })).optional(),
});
// Update Transaction Request Schema
exports.UpdateTransactionSchema = exports.CreateTransactionSchema.partial().extend({
    id: zod_1.z.string(),
});
// Transaction Split Request Schema
exports.CreateTransactionSplitSchema = zod_1.z.object({
    transactionId: zod_1.z.string(),
    splits: zod_1.z.array(zod_1.z.object({
        amount: zod_1.z.number().positive(),
        categoryId: zod_1.z.string(),
        description: zod_1.z.string().optional(),
    })).min(2), // Must have at least 2 splits
});
//# sourceMappingURL=transactions.js.map