import { z } from 'zod';

// GDPR Consent types
export const GdprConsentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  consentType: z.enum(['essential', 'analytics', 'marketing', 'automated_decisions']),
  granted: z.boolean(),
  grantedAt: z.date().optional(),
  withdrawnAt: z.date().optional(),
  version: z.string(),
});

export const GdprRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requestType: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  requestedAt: z.date(),
  completedAt: z.date().optional(),
});

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  ipAddress: z.string().optional(),
  timestamp: z.date(),
});

// Request schemas
export const ConsentUpdateSchema = z.object({
  consentType: z.enum(['essential', 'analytics', 'marketing', 'automated_decisions']),
  granted: z.boolean(),
  version: z.string(),
});

export const GdprDataRequestSchema = z.object({
  requestType: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
  reason: z.string().optional(),
  specificData: z.string().optional(),
});

export const DataRectificationSchema = z.object({
  field: z.string(),
  currentValue: z.string(),
  newValue: z.string(),
  reason: z.string(),
});

// Type exports
export type GdprConsent = z.infer<typeof GdprConsentSchema>;
export type GdprRequest = z.infer<typeof GdprRequestSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type ConsentUpdateRequest = z.infer<typeof ConsentUpdateSchema>;
export type GdprDataRequest = z.infer<typeof GdprDataRequestSchema>;
export type DataRectificationRequest = z.infer<typeof DataRectificationSchema>;

// Response types
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