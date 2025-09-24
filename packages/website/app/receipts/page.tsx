'use client';

import { OCRReceiptProcessor } from '@/components/receipts/OCRReceiptProcessor';

export default function ReceiptsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Receipt Processing
        </h1>
        <p className="text-gray-600 mt-2">
          Upload receipt photos and automatically extract transaction details with AI-powered OCR.
        </p>
      </div>

      <OCRReceiptProcessor />
    </div>
  );
}