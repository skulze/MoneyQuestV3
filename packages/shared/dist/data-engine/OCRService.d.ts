/**
 * OCRService - Receipt OCR processing (Plus & Premium feature)
 *
 * Processes receipt images to extract transaction data
 * Available for Plus ($2.99/month) and Premium ($9.99/month) users
 */
import { Transaction } from '../types/transactions';
export interface OCRResult {
    success: boolean;
    confidence: number;
    merchant: string;
    amount: number;
    date: Date;
    category?: string;
    lineItems?: OCRLineItem[];
    rawText: string;
}
export interface OCRLineItem {
    description: string;
    amount: number;
    quantity?: number;
}
export interface ProcessReceiptOptions {
    enhanceQuality?: boolean;
    extractLineItems?: boolean;
    autoCategories?: boolean;
}
export declare class OCRService {
    private static readonly API_ENDPOINT;
    /**
     * Process receipt image and extract transaction data
     */
    static processReceipt(imageFile: File | any, options?: ProcessReceiptOptions): Promise<Transaction[]>;
    /**
     * Get supported file types for OCR
     */
    static getSupportedFileTypes(): string[];
    /**
     * Get OCR usage stats for current month
     */
    static getUsageStats(userId: string): Promise<{
        used: number;
        limit: number;
        remaining: number;
    }>;
    private static isValidImageType;
    private static sendToOCRService;
    private static convertOCRToTransactions;
    private static getCategoryId;
    private static generateId;
    /**
     * Enhance image quality before OCR processing
     */
    private static enhanceImageQuality;
    /**
     * Validate OCR results for accuracy
     */
    private static validateOCRResult;
    /**
     * Log OCR results for accuracy tracking
     */
    static logOCRResult(userId: string, result: OCRResult, userCorrections?: any): Promise<void>;
}
//# sourceMappingURL=OCRService.d.ts.map