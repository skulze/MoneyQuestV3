"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRectificationSchema = exports.GdprDataRequestSchema = exports.ConsentUpdateSchema = exports.AuditLogSchema = exports.GdprRequestSchema = exports.GdprConsentSchema = void 0;
const zod_1 = require("zod");
// GDPR Consent types
exports.GdprConsentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    consentType: zod_1.z.enum(['essential', 'analytics', 'marketing', 'automated_decisions']),
    granted: zod_1.z.boolean(),
    grantedAt: zod_1.z.date().optional(),
    withdrawnAt: zod_1.z.date().optional(),
    version: zod_1.z.string(),
});
exports.GdprRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    requestType: zod_1.z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'rejected']),
    requestedAt: zod_1.z.date(),
    completedAt: zod_1.z.date().optional(),
});
exports.AuditLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    action: zod_1.z.string(),
    resourceType: zod_1.z.string(),
    resourceId: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().optional(),
    timestamp: zod_1.z.date(),
});
// Request schemas
exports.ConsentUpdateSchema = zod_1.z.object({
    consentType: zod_1.z.enum(['essential', 'analytics', 'marketing', 'automated_decisions']),
    granted: zod_1.z.boolean(),
    version: zod_1.z.string(),
});
exports.GdprDataRequestSchema = zod_1.z.object({
    requestType: zod_1.z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
    reason: zod_1.z.string().optional(),
    specificData: zod_1.z.string().optional(),
});
exports.DataRectificationSchema = zod_1.z.object({
    field: zod_1.z.string(),
    currentValue: zod_1.z.string(),
    newValue: zod_1.z.string(),
    reason: zod_1.z.string(),
});
//# sourceMappingURL=gdpr.js.map