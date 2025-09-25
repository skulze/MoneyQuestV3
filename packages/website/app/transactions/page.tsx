'use client';

import { useState, useEffect } from 'react';
import { TransactionWithSplits, UpdateTransactionRequest } from '@moneyquest/shared';
import { useDataEngine } from '@/hooks/useDataEngine';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { TransactionList, TransactionEditModal, TransactionSplitModal } from '@/components/transactions';
import { Button, Modal, Input, CurrencyInput } from '@/components/ui';
import { Plus, FileText } from 'lucide-react';

export default function TransactionsPage() {
  const { session, isLoading: authLoading } = useAuthGuard('/transactions');
  const { dataEngine, stats, refreshStats, addTransaction, subscriptionTier } = useDataEngine();

  const [transactions, setTransactions] = useState<TransactionWithSplits[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Transaction Modal
  const [addModal, setAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    accountId: '',
    categoryId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Transaction Modal
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    transaction: TransactionWithSplits | null;
  }>({ isOpen: false, transaction: null });

  // Split Transaction Modal
  const [splitModal, setSplitModal] = useState<{
    isOpen: boolean;
    transaction: TransactionWithSplits | null;
  }>({ isOpen: false, transaction: null });

  // Load transactions when data engine is ready
  useEffect(() => {
    if (!dataEngine) return;

    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const fetchedTransactions = await dataEngine.getTransactions();
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [dataEngine]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataEngine || !session?.user?.id) return;

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!addFormData.description.trim()) newErrors.description = 'Description is required';
    if (addFormData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!addFormData.accountId) newErrors.accountId = 'Account is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert amount based on type (expenses are negative)
      const amount = addFormData.type === 'expense' ? -addFormData.amount : addFormData.amount;

      const transaction = await addTransaction({
        description: addFormData.description,
        originalAmount: amount,
        date: addFormData.date,
        accountId: addFormData.accountId,
        categoryId: addFormData.categoryId || undefined
      });

      if (transaction) {
        // Refresh transaction list
        const updatedTransactions = await dataEngine.getTransactions();
        setTransactions(updatedTransactions);

        // Reset form and close modal
        setAddFormData({
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          accountId: '',
          categoryId: ''
        });
        setFormErrors({});
        setAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
      setFormErrors({ submit: 'Failed to add transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = (transaction: TransactionWithSplits) => {
    setEditModal({ isOpen: true, transaction });
  };

  const handleUpdateTransaction = async (transactionId: string, updates: UpdateTransactionRequest) => {
    if (!dataEngine) return;

    try {
      await dataEngine.updateTransaction(transactionId, updates);

      // Refresh transaction list
      const updatedTransactions = await dataEngine.getTransactions();
      setTransactions(updatedTransactions);

      // Refresh stats
      await refreshStats();

      setEditModal({ isOpen: false, transaction: null });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!dataEngine) return;

    try {
      await dataEngine.deleteTransaction(transactionId);

      // Refresh transaction list
      const updatedTransactions = await dataEngine.getTransactions();
      setTransactions(updatedTransactions);

      // Refresh stats
      await refreshStats();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleSplitTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setSplitModal({ isOpen: true, transaction });
    }
  };

  const handleSplitTransactionSubmit = async (splitData: any) => {
    if (!dataEngine) return;

    try {
      await dataEngine.splitTransaction(splitData);

      // Refresh transaction list
      const updatedTransactions = await dataEngine.getTransactions();
      setTransactions(updatedTransactions);

      // Refresh stats
      await refreshStats();

      setSplitModal({ isOpen: false, transaction: null });
    } catch (error) {
      console.error('Failed to split transaction:', error);
      throw error;
    }
  };

  // Show loading spinner while auth is being checked
  if (authLoading || !session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all your financial transactions
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>

            {subscriptionTier !== 'free' && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled // TODO: Implement report generation
              >
                <FileText className="w-4 h-4" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-700 text-sm font-medium">Total Transactions</div>
            <div className="text-blue-900 text-2xl font-bold">{stats.transactionCount}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-700 text-sm font-medium">Total Balance</div>
            <div className="text-green-900 text-2xl font-bold">
              ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-700 text-sm font-medium">Categories</div>
            <div className="text-purple-900 text-2xl font-bold">{stats.categoryCount}</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onSplitTransaction={handleSplitTransaction}
          subscriptionTier={subscriptionTier}
        />
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => !isSubmitting && setAddModal(false)}
        title="Add New Transaction"
        description="Enter the details for your new transaction."
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Input
              type="text"
              value={addFormData.description}
              onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter transaction description"
              error={formErrors.description}
              disabled={isSubmitting}
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={addFormData.type === 'expense'}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, type: 'expense' }))}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                Expense
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={addFormData.type === 'income'}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, type: 'income' }))}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                Income
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <CurrencyInput
              value={addFormData.amount}
              onChange={(value) => setAddFormData(prev => ({ ...prev, amount: value }))}
              placeholder="0.00"
              error={formErrors.amount}
              disabled={isSubmitting}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <Input
              type="date"
              value={addFormData.date}
              onChange={(e) => setAddFormData(prev => ({ ...prev, date: e.target.value }))}
              error={formErrors.date}
              disabled={isSubmitting}
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <select
              value={addFormData.accountId}
              onChange={(e) => setAddFormData(prev => ({ ...prev, accountId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Select an account</option>
              {stats.accounts.map((account: any) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {formErrors.accountId && (
              <p className="mt-1 text-sm text-red-600">{formErrors.accountId}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={addFormData.categoryId}
              onChange={(e) => setAddFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">No category</option>
              {stats.categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formErrors.submit && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-red-600 text-sm">{formErrors.submit}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, transaction: null })}
        transaction={editModal.transaction}
        onUpdate={handleUpdateTransaction}
        accounts={stats.accounts}
        categories={stats.categories}
      />

      {/* Split Transaction Modal */}
      <TransactionSplitModal
        isOpen={splitModal.isOpen}
        onClose={() => setSplitModal({ isOpen: false, transaction: null })}
        transaction={splitModal.transaction}
        onSplitTransaction={handleSplitTransactionSubmit}
        categories={stats.categories}
      />
    </div>
  );
}