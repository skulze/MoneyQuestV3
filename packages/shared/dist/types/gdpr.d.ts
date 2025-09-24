import { z } from 'zod';
export declare const GdprConsentSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    consentType: z.ZodEnum<["essential", "analytics", "marketing", "automated_decisions"]>;
    granted: z.ZodBoolean;
    grantedAt: z.ZodOptional<z.ZodDate>;
    withdrawnAt: z.ZodOptional<z.ZodDate>;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    consentType: "essential" | "analytics" | "marketing" | "automated_decisions";
    granted: boolean;
    version: string;
    grantedAt?: Date | undefined;
    withdrawnAt?: Date | undefined;
}, {
    id: string;
    userId: string;
    consentType: "essential" | "analytics" | "marketing" | "automated_decisions";
    granted: boolean;
    version: string;
    grantedAt?: Date | undefined;
    withdrawnAt?: Date | undefined;
}>;
export declare const GdprRequestSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    requestType: z.ZodEnum<["access", "rectification", "erasure", "portability", "restriction"]>;
    status: z.ZodEnum<["pending", "processing", "completed", "rejected"]>;
    requestedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "pending" | "processing" | "completed" | "rejected";
    userId: string;
    requestType: "access" | "rectification" | "erasure" | "portability" | "restriction";
    requestedAt: Date;
    completedAt?: Date | undefined;
}, {
    id: string;
    status: "pending" | "processing" | "completed" | "rejected";
    userId: string;
    requestType: "access" | "rectification" | "erasure" | "portability" | "restriction";
    requestedAt: Date;
    completedAt?: Date | undefined;
}>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    action: z.ZodString;
    resourceType: z.ZodString;
    resourceId: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    action: string;
    resourceType: string;
    timestamp: Date;
    userId?: string | undefined;
    resourceId?: string | undefined;
    ipAddress?: string | undefined;
}, {
    id: string;
    action: string;
    resourceType: string;
    timestamp: Date;
    userId?: string | undefined;
    resourceId?: string | undefined;
    ipAddress?: string | undefined;
}>;
export declare const ConsentUpdateSchema: z.ZodObject<{
    consentType: z.ZodEnum<["essential", "analytics", "marketing", "automated_decisions"]>;
    granted: z.ZodBoolean;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    consentType: "essential" | "analytics" | "marketing" | "automated_decisions";
    granted: boolean;
    version: string;
}, {
    consentType: "essential" | "analytics" | "marketing" | "automated_decisions";
    granted: boolean;
    version: string;
}>;
export declare const GdprDataRequestSchema: z.ZodObject<{
    requestType: z.ZodEnum<["access", "rectification", "erasure", "portability", "restriction"]>;
    reason: z.ZodOptional<z.ZodString>;
    specificData: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    requestType: "access" | "rectification" | "erasure" | "portability" | "restriction";
    reason?: string | undefined;
    specificData?: string | undefined;
}, {
    requestType: "access" | "rectification" | "erasure" | "portability" | "restriction";
    reason?: string | undefined;
    specificData?: string | undefined;
}>;
export declare const DataRectificationSchema: z.ZodObject<{
    field: z.ZodString;
    currentValue: z.ZodString;
    newValue: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    field: string;
    currentValue: string;
    newValue: string;
}, {
    reason: string;
    field: string;
    currentValue: string;
    newValue: string;
}>;
export type GdprConsent = z.infer<typeof GdprConsentSchema>;
export type GdprRequest = z.infer<typeof GdprRequestSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type ConsentUpdateRequest = z.infer<typeof ConsentUpdateSchema>;
export type GdprDataRequest = z.infer<typeof GdprDataRequestSchema>;
export type DataRectificationRequest = z.infer<typeof DataRectificationSchema>;
export interface UserConsents {
    essential: GdprConsent;
    analytics?: GdprConsent;
    marketing?: GdprConsent;
    automatedDecisions?: GdprConsent;
}
export interface DataExportResponse {
    userId: string;
    exportedAt: string;
    data: {
        personalInfo: any;
        transactions: any[];
        categories: any[];
        budgets: any[];
        consents: GdprConsent[];
        auditLogs: AuditLog[];
    };
}
export interface GdprRequestStatus {
    requestId: string;
    status: string;
    submittedAt: string;
    estimatedCompletion?: string;
    completedAt?: string;
    downloadUrl?: string;
}
//# sourceMappingURL=gdpr.d.ts.map