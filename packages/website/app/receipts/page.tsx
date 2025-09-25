'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { OCRReceiptProcessor } from '@/components/receipts/OCRReceiptProcessor';

export default function ReceiptsPage() {
  const { session, isLoading: authLoading } = useAuthGuard('/receipts');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // useAuthGuard handles redirect
  }
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