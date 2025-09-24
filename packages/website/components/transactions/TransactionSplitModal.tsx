'use client';

import { useState, useEffect } from 'react';
import { TransactionWithSplits, CreateTransactionSplitRequest } from '@moneyquest/shared';
import { Modal, Button, Input, CurrencyInput } from '../ui';
import { formatCurrency } from '@/lib/utils';
import { Plus, X, AlertTriangle } from 'lucide-react';

interface TransactionSplit {
  description: string;
  amount: number;
  categoryId: string;
}

interface TransactionSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithSplits | null;
  onSplitTransaction: (splitData: CreateTransactionSplitRequest) => Promise<void>;
  categories: Array<{ id: string; name: string; }>;
}

export function TransactionSplitModal({
  isOpen,
  onClose,
  transaction,
  onSplitTransaction,
  categories
}: TransactionSplitModalProps) {
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize splits when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      // Start with one split that matches the original transaction
      setSplits([
        {
          description: transaction.description,
          amount: Math.abs(transaction.originalAmount),
          categoryId: transaction.categoryId || ''
        }
      ]);
      setErrors({});
    }
  }, [transaction, isOpen]);

  // Calculate totals
  const totalSplitAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const originalAmount = transaction ? Math.abs(transaction.originalAmount) : 0;
  const remainingAmount = originalAmount - totalSplitAmount;
  const isValidTotal = Math.abs(remainingAmount) < 0.01; // Allow for small rounding differences

  const addSplit = () => {
    const newSplit: TransactionSplit = {
      description: '',
      amount: Math.max(0, remainingAmount),
      categoryId: ''
    };
    setSplits(prev => [...prev, newSplit]);
  };

  const updateSplit = (index: number, field: keyof TransactionSplit, value: string | number) => {
    setSplits(prev =>
      prev.map((split, i) =>
        i === index ? { ...split, [field]: value } : split
      )
    );
  };

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateSplits = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if we have at least 2 splits
    if (splits.length < 2) {
      newErrors.general = 'You need at least 2 splits to split a transaction';
    }

    // Validate each split
    splits.forEach((split, index) => {
      if (!split.description.trim()) {
        newErrors[`description-${index}`] = 'Description is required';
      }
      if (split.amount <= 0) {
        newErrors[`amount-${index}`] = 'Amount must be greater than 0';
      }
      // Category is optional
    });

    // Check total amount
    if (!isValidTotal) {
      newErrors.total = `Split total (${formatCurrency(totalSplitAmount)}) must equal original amount (${formatCurrency(originalAmount)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!transaction || !validateSplits()) return;

    setIsSubmitting(true);

    try {
      const splitRequest: CreateTransactionSplitRequest = {
        transactionId: transaction.id,
        splits: splits.map(split => ({
          description: split.description,
          amount: split.amount,
          categoryId: split.categoryId || transaction.categoryId || 'default'
        })).filter(split => split.categoryId !== undefined)
      };

      await onSplitTransaction(splitRequest);
      onClose();
    } catch (error) {
      console.error('Failed to split transaction:', error);
      setErrors({ submit: 'Failed to split transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSplits([]);
      setErrors({});
      onClose();
    }
  };

  // Auto-distribute remaining amount to last split
  const autoDistribute = () => {
    if (splits.length > 0) {
      const lastIndex = splits.length - 1;
      updateSplit(lastIndex, 'amount', Math.max(0, splits[lastIndex].amount + remainingAmount));
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Split Transaction"
      description="Divide this transaction into multiple parts with different categories."
    >
      <div className="space-y-6">
        {/* Original Transaction Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Original Transaction</h4>
              <p className="text-blue-700 text-sm">{transaction.description}</p>
              <p className="text-blue-900 font-medium">{formatCurrency(originalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Splits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Transaction Splits</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSplit}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              Add Split
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {splits.map((split, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <Input
                        type="text"
                        value={split.description}
                        onChange={(e) => updateSplit(index, 'description', e.target.value)}
                        placeholder="What is this part for?"
                        error={errors[`description-${index}`]}
                        disabled={isSubmitting}
                        className="text-sm"
                      />
                    </div>

                    {/* Amount and Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Amount *
                        </label>
                        <CurrencyInput
                          value={split.amount}
                          onChange={(value) => updateSplit(index, 'amount', value)}
                          placeholder="0.00"
                          error={errors[`amount-${index}`]}
                          disabled={isSubmitting}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={split.categoryId}
                          onChange={(e) => updateSplit(index, 'categoryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isSubmitting}
                        >
                          <option value="">No category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {splits.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplit(index)}
                      disabled={isSubmitting}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-medium">{formatCurrency(originalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Split Total:</span>
              <span className={`font-medium ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalSplitAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${Math.abs(remainingAmount) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          {!isValidTotal && Math.abs(remainingAmount) > 0.01 && (
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-800">
                  Split amounts don't match the original transaction.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={autoDistribute}
                  className="text-xs text-blue-600 hover:text-blue-700 px-0 mt-1"
                  disabled={isSubmitting}
                >
                  Auto-distribute remaining amount
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* General Errors */}
        {errors.general && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {errors.total && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-red-600 text-sm">{errors.total}</p>
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidTotal || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Splitting...' : 'Split Transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}