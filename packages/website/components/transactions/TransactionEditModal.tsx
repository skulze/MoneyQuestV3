'use client';

import { useState, useEffect } from 'react';
import { TransactionWithSplits, UpdateTransactionRequest } from '@moneyquest/shared';
import { Modal, Button, Input, CurrencyInput } from '../ui';

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithSplits | null;
  onUpdate: (transactionId: string, updates: UpdateTransactionRequest) => Promise<void>;
  accounts: Array<{ id: string; name: string; }>;
  categories: Array<{ id: string; name: string; }>;
}

export function TransactionEditModal({
  isOpen,
  onClose,
  transaction,
  onUpdate,
  accounts,
  categories
}: TransactionEditModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    date: '',
    accountId: '',
    categoryId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: Math.abs(transaction.originalAmount), // Show as positive for editing
        date: new Date(transaction.date).toISOString().split('T')[0],
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || ''
      });
      setErrors({});
    }
  }, [transaction]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction || !validateForm()) return;

    setIsSubmitting(true);

    try {
      // Preserve the original amount sign (income vs expense)
      const originalAmount = transaction.originalAmount < 0 ? -formData.amount : formData.amount;

      const updates: UpdateTransactionRequest = {
        id: transaction.id,
        description: formData.description,
        originalAmount,
        date: formData.date,
        accountId: formData.accountId,
        categoryId: formData.categoryId || undefined
      };

      await onUpdate(transaction.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      setErrors({ submit: 'Failed to update transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Transaction"
      description="Update the transaction details below."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <Input
            id="edit-description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter transaction description"
            error={errors.description}
            disabled={isSubmitting}
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount * <span className="text-xs text-gray-500">({transaction.originalAmount < 0 ? 'Expense' : 'Income'})</span>
          </label>
          <CurrencyInput
            id="edit-amount"
            value={formData.amount}
            onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
            placeholder="0.00"
            error={errors.amount}
            disabled={isSubmitting}
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <Input
            id="edit-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            error={errors.date}
            disabled={isSubmitting}
          />
        </div>

        {/* Account */}
        <div>
          <label htmlFor="edit-account" className="block text-sm font-medium text-gray-700 mb-1">
            Account *
          </label>
          <select
            id="edit-account"
            value={formData.accountId}
            onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="edit-category"
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Transaction Type Info */}
        {transaction.splits && transaction.splits.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 text-sm">
                ℹ️ This transaction has been split into {transaction.splits.length} parts. Changes to the amount will affect the proportional splits.
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
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
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}