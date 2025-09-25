import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Camera, Upload, FileImage, CheckCircle, AlertCircle, Loader2, X, Edit } from 'lucide-react';
import { ocrService } from '@/services/ocrService';
import { useDataEngine } from '@/hooks/useDataEngine';

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
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processedReceipts, setProcessedReceipts] = useState<ProcessedTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dataEngine } = useDataEngine();

  // Cleanup OCR service when component unmounts
  useEffect(() => {
    return () => {
      ocrService.cleanup().catch(console.error);
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      setSelectedFile(imageFile);
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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
    setProcessingStatus('Initializing OCR engine...');

    try {
      // Initialize OCR engine
      await ocrService.initialize();
      setProcessingStatus('Reading receipt image...');

      // Process image with OCR
      const ocrResult = await ocrService.processReceiptImage(selectedFile);
      setProcessingStatus('Extracting transaction details...');

      // Just show the raw OCR text for now
      const processed: ProcessedTransaction = {
        id: Date.now().toString(),
        merchant: 'RAW OCR TEXT',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'OCR Debug',
        items: [{
          name: 'RAW_OCR_OUTPUT',
          price: 0
        }],
        confidence: Math.round(ocrResult.confidence),
        status: 'reviewing'
      };

      console.log('✅ Raw OCR text extracted:', ocrResult.text);
      console.log('OCR Confidence:', ocrResult.confidence);

      // Store the raw text in the processed receipt for display
      (processed as any).rawOcrText = ocrResult.text;

      setProcessedReceipts(prev => [processed, ...prev]);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setProcessingStatus('');
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process receipt: ${errorMessage}\n\nPlease try again with a clearer image.`);
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTransaction = async (receiptId: string) => {
    const receipt = processedReceipts.find(r => r.id === receiptId);
    if (!receipt || !dataEngine) return;

    try {
      // Create transaction splits for each item or a single transaction
      const splits = receipt.items && receipt.items.length > 0
        ? receipt.items.map(item => ({
            amount: item.price,
            category: receipt.category || 'Shopping',
            description: item.name,
            quantity: item.quantity
          }))
        : [{
            amount: receipt.amount,
            category: receipt.category || 'Shopping',
            description: receipt.merchant,
          }];

      // Add transaction to data engine
      const transaction = await dataEngine.addTransaction({
        description: receipt.merchant,
        amount: -receipt.amount, // Negative for expense
        date: new Date(receipt.date),
        category: receipt.category || 'Shopping',
        splits: splits.length > 1 ? splits : undefined,
        metadata: {
          source: 'ocr',
          originalText: receipt.items?.map(i => i.name).join(', ') || receipt.merchant,
          confidence: receipt.confidence
        }
      });

      console.log('✅ Transaction saved to data engine:', transaction);

      // Update receipt status
      setProcessedReceipts(prev =>
        prev.map(r =>
          r.id === receiptId
            ? { ...r, status: 'confirmed' as const }
            : r
        )
      );

      alert('✅ Transaction added to your account!');
    } catch (error) {
      console.error('❌ Failed to save transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
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
                <label
                  htmlFor="file-upload-input"
                  className="cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className={`h-32 flex flex-col items-center justify-center space-y-2 border-dashed border-2 rounded-lg transition-colors ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                  }`}>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium">Upload or Drop Photo</span>
                    <span className="text-xs text-gray-500">JPG, PNG up to 10MB</span>
                  </div>
                </label>

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
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px'
                }}
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
                  <p className="text-sm text-gray-600">
                    {processingStatus || 'Using OCR to extract transaction details'}
                  </p>
                  <div className="mt-4 text-xs text-gray-500">
                    This may take 30-60 seconds for first-time OCR initialization
                  </div>
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

                    {/* Raw OCR Text */}
                    {(receipt as any).rawOcrText && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Raw OCR Text:</h5>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap font-mono text-gray-800">
                            {(receipt as any).rawOcrText}
                          </pre>
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