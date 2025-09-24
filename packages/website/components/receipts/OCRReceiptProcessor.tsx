import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Camera, Upload, FileImage, CheckCircle, AlertCircle, Loader2, X, Edit } from 'lucide-react';

interface ProcessedTransaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  confidence: number;
  status: 'processed' | 'reviewing' | 'confirmed';
}

export function OCRReceiptProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      // Create a video element to capture from camera
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // For demo purposes, we'll simulate camera capture
      // In a real implementation, you'd capture a frame from the video stream
      alert('Camera capture would be implemented here. For now, please use file upload.');

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access denied or not available. Please use file upload instead.');
    }
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // Simulate OCR processing - in reality this would call the LocalDataEngine.processReceiptOCR()
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock processed transaction data
      const processed: ProcessedTransaction = {
        id: Date.now().toString(),
        merchant: 'Whole Foods Market',
        amount: 47.82,
        date: new Date().toISOString().split('T')[0],
        category: 'Groceries',
        items: [
          { name: 'Organic Bananas', price: 3.99, quantity: 1 },
          { name: 'Almond Milk', price: 4.99, quantity: 2 },
          { name: 'Whole Grain Bread', price: 5.49, quantity: 1 },
          { name: 'Mixed Greens', price: 6.99, quantity: 1 },
          { name: 'Chicken Breast', price: 12.99, quantity: 2 },
          { name: 'Tax', price: 3.38, quantity: 1 },
        ],
        confidence: 94,
        status: 'reviewing'
      };

      setProcessedReceipts(prev => [processed, ...prev]);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTransaction = (receiptId: string) => {
    setProcessedReceipts(prev =>
      prev.map(receipt =>
        receipt.id === receiptId
          ? { ...receipt, status: 'confirmed' as const }
          : receipt
      )
    );
  };

  const editTransaction = (receiptId: string) => {
    // In a real app, this would open an edit modal
    alert('Edit transaction functionality would be implemented here');
  };

  const deleteReceipt = (receiptId: string) => {
    setProcessedReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reviewing':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <FeatureGate feature="ocrReceipts">
      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Receipt Processing (OCR)
            </CardTitle>
            <p className="text-sm text-gray-600">
              Upload or capture receipt photos to automatically extract transaction data.
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center space-y-2 border-dashed border-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium">Upload Photo</span>
                  <span className="text-xs text-gray-500">JPG, PNG up to 10MB</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center space-y-2 border-dashed border-2"
                  onClick={handleCameraCapture}
                  disabled={isProcessing}
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium">Take Photo</span>
                  <span className="text-xs text-gray-500">Use device camera</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Image Preview & Processing */}
              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Ready to Process</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        The receipt image will be analyzed to extract transaction details automatically.
                      </p>
                      <div className="flex space-x-3">
                        <Button
                          onClick={processReceipt}
                          disabled={isProcessing}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FileImage className="w-4 h-4 mr-2" />
                              Process Receipt
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                  <p className="text-lg font-medium text-gray-900">Processing Receipt...</p>
                  <p className="text-sm text-gray-600">Using AI to extract transaction details</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processed Receipts */}
        {processedReceipts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processed Receipts</CardTitle>
              <p className="text-sm text-gray-600">
                Review and confirm the extracted transaction data.
              </p>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {processedReceipts.map((receipt) => (
                  <div key={receipt.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(receipt.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{receipt.merchant}</h4>
                          <p className="text-sm text-gray-600">{receipt.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(receipt.confidence)}`}>
                          {receipt.confidence}% confidence
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${receipt.amount.toFixed(2)}
                          </p>
                          {receipt.category && (
                            <p className="text-xs text-gray-500">{receipt.category}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    {receipt.items && receipt.items.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Items:</h5>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="space-y-1 text-xs">
                            {receipt.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.quantity && item.quantity > 1 && `${item.quantity}x `}{item.name}</span>
                                <span>${item.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {receipt.status === 'reviewing' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => confirmTransaction(receipt.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editTransaction(receipt.id)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                        {receipt.status === 'confirmed' && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Transaction Added
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReceipt(receipt.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📷 Photo Quality</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Ensure good lighting</li>
                  <li>• Keep receipt flat and straight</li>
                  <li>• Avoid shadows and glare</li>
                  <li>• Capture the entire receipt</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✨ Best Practices</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Process receipts immediately</li>
                  <li>• Review extracted data carefully</li>
                  <li>• Confirm or edit before saving</li>
                  <li>• Category suggestions are auto-generated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}