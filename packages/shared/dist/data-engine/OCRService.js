"use strict";
/**
 * OCRService - Receipt OCR processing (Plus & Premium feature)
 *
 * Processes receipt images to extract transaction data
 * Available for Plus ($2.99/month) and Premium ($9.99/month) users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = void 0;
class OCRService {
    /**
     * Process receipt image and extract transaction data
     */
    static async processReceipt(imageFile, options = {}) {
        try {
            // Validate file type
            if (!this.isValidImageType(imageFile)) {
                throw new Error('Invalid file type. Please upload PNG, JPG, or PDF files.');
            }
            // Validate file size (max 10MB)
            if (imageFile.size > 10 * 1024 * 1024) {
                throw new Error('File too large. Please upload files smaller than 10MB.');
            }
            console.log('📸 Processing receipt with OCR...');
            // TODO: Implement actual OCR processing
            // This will send image to cloud OCR service (Google Vision, AWS Textract, or Azure)
            const ocrResult = await this.sendToOCRService(imageFile, options);
            // Convert OCR result to transactions
            const transactions = this.convertOCRToTransactions(ocrResult);
            console.log('✅ OCR processing complete:', transactions.length, 'transactions extracted');
            return transactions;
        }
        catch (error) {
            console.error('❌ OCR processing failed:', error);
            throw error;
        }
    }
    /**
     * Get supported file types for OCR
     */
    static getSupportedFileTypes() {
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    }
    /**
     * Get OCR usage stats for current month
     */
    static async getUsageStats(userId) {
        // TODO: Query usage from database
        // For now, return mock data
        return {
            used: 15,
            limit: 100,
            remaining: 85,
        };
    }
    // ==========================================
    // Private Methods
    // ==========================================
    static isValidImageType(file) {
        if (!file || !file.type)
            return false;
        return this.getSupportedFileTypes().includes(file.type);
    }
    static async sendToOCRService(imageFile, options) {
        // TODO: Implement actual OCR service integration
        // This will integrate with cloud OCR providers
        // Mock OCR result for development
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing delay
        const mockResult = {
            success: true,
            confidence: 0.92,
            merchant: 'Grocery Store',
            amount: 45.67,
            date: new Date(),
            category: 'Groceries',
            lineItems: [
                { description: 'Milk', amount: 3.99, quantity: 1 },
                { description: 'Bread', amount: 2.50, quantity: 1 },
                { description: 'Eggs', amount: 4.25, quantity: 1 },
                { description: 'Bananas', amount: 1.89, quantity: 2 },
                { description: 'Tax', amount: 2.04, quantity: 1 },
            ],
            rawText: `
        GROCERY STORE
        123 Main St

        Milk             $3.99
        Bread            $2.50
        Eggs             $4.25
        Bananas (2)      $1.89

        Subtotal:       $12.63
        Tax:             $2.04
        Total:          $45.67

        Thank you!
      `.trim(),
        };
        return mockResult;
    }
    static convertOCRToTransactions(ocrResult) {
        const baseTransaction = {
            id: this.generateId(),
            originalAmount: ocrResult.amount,
            description: `Receipt from ${ocrResult.merchant}`,
            date: ocrResult.date,
            isParent: ocrResult.lineItems && ocrResult.lineItems.length > 1,
            categoryId: ocrResult.category ? this.getCategoryId(ocrResult.category) : undefined,
            accountId: '', // Will be set by the calling code
        };
        // If we have line items, create splits
        if (ocrResult.lineItems && ocrResult.lineItems.length > 1) {
            return [
                {
                    ...baseTransaction,
                    // splits will be created separately
                },
            ];
        }
        // Single transaction
        return [baseTransaction];
    }
    static getCategoryId(categoryName) {
        // TODO: Map category names to actual category IDs
        // This should query the user's categories and find best match
        const categoryMap = {
            'Groceries': 'cat_groceries',
            'Restaurant': 'cat_dining',
            'Gas': 'cat_transportation',
            'Shopping': 'cat_shopping',
            'Entertainment': 'cat_entertainment',
        };
        return categoryMap[categoryName] || 'cat_other';
    }
    static generateId() {
        return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ==========================================
    // Quality Enhancement
    // ==========================================
    /**
     * Enhance image quality before OCR processing
     */
    static async enhanceImageQuality(imageFile) {
        // TODO: Implement image enhancement
        // - Increase contrast
        // - Straighten/rotate image
        // - Remove noise
        // - Sharpen text
        return imageFile; // For now, return original
    }
    /**
     * Validate OCR results for accuracy
     */
    static validateOCRResult(result) {
        // Basic validation
        if (result.confidence < 0.7)
            return false;
        if (!result.merchant || result.merchant.length < 2)
            return false;
        if (result.amount <= 0)
            return false;
        if (!result.date || isNaN(result.date.getTime()))
            return false;
        return true;
    }
    // ==========================================
    // Analytics & Improvement
    // ==========================================
    /**
     * Log OCR results for accuracy tracking
     */
    static async logOCRResult(userId, result, userCorrections) {
        // TODO: Log OCR results to improve accuracy over time
        // Track which merchants/formats work well
        // Track common user corrections
        const logEntry = {
            userId,
            timestamp: new Date(),
            confidence: result.confidence,
            merchant: result.merchant,
            amount: result.amount,
            wasAccurate: !userCorrections || Object.keys(userCorrections).length === 0,
            corrections: userCorrections,
        };
        console.log('📊 OCR result logged:', logEntry);
    }
}
exports.OCRService = OCRService;
OCRService.API_ENDPOINT = '/api/ocr/process-receipt';
//# sourceMappingURL=OCRService.js.map