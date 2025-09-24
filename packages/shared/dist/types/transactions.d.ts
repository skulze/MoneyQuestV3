import { z } from 'zod';
export declare const TransactionSchema: z.ZodObject<{
    id: z.ZodString;
    originalAmount: z.ZodNumber;
    description: z.ZodString;
    isParent: z.ZodBoolean;
    date: z.ZodDate;
    categoryId: z.ZodOptional<z.ZodString>;
    accountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    originalAmount: number;
    description: string;
    isParent: boolean;
    date: Date;
    accountId: string;
    categoryId?: string | undefined;
}, {
    id: string;
    originalAmount: number;
    description: string;
    isParent: boolean;
    date: Date;
    accountId: string;
    categoryId?: string | undefined;
}>;
export declare const TransactionSplitSchema: z.ZodObject<{
    id: z.ZodString;
    transactionId: z.ZodString;
    amount: z.ZodNumber;
    categoryId: z.ZodString;
    percentage: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    categoryId: string;
    transactionId: string;
    amount: number;
    percentage: number;
    description?: string | undefined;
}, {
    id: string;
    categoryId: string;
    transactionId: string;
    amount: number;
    percentage: number;
    description?: string | undefined;
}>;
export declare const CreateTransactionSchema: z.ZodObject<{
    accountId: z.ZodString;
    originalAmount: z.ZodNumber;
    description: z.ZodString;
    date: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
    splits: z.ZodOptional<z.ZodArray<z.ZodObject<{
        amount: z.ZodNumber;
        categoryId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    originalAmount: number;
    description: string;
    date: string;
    accountId: string;
    categoryId?: string | undefined;
    splits?: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[] | undefined;
}, {
    originalAmount: number;
    description: string;
    date: string;
    accountId: string;
    categoryId?: string | undefined;
    splits?: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const UpdateTransactionSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    originalAmount: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    splits: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        amount: z.ZodNumber;
        categoryId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }>, "many">>>;
} & {
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    originalAmount?: number | undefined;
    description?: string | undefined;
    date?: string | undefined;
    categoryId?: string | undefined;
    accountId?: string | undefined;
    splits?: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[] | undefined;
}, {
    id: string;
    originalAmount?: number | undefined;
    description?: string | undefined;
    date?: string | undefined;
    categoryId?: string | undefined;
    accountId?: string | undefined;
    splits?: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const CreateTransactionSplitSchema: z.ZodObject<{
    transactionId: z.ZodString;
    splits: z.ZodArray<z.ZodObject<{
        amount: z.ZodNumber;
        categoryId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }, {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    transactionId: string;
    splits: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[];
}, {
    transactionId: string;
    splits: {
        categoryId: string;
        amount: number;
        description?: string | undefined;
    }[];
}>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionSplit = z.infer<typeof TransactionSplitSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionSchema>;
export type CreateTransactionSplitRequest = z.infer<typeof CreateTransactionSplitSchema>;
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
//# sourceMappingURL=transactions.d.ts.map