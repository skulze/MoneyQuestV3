'use client';

import { useState, useEffect } from 'react';
import { TransactionWithSplits } from '@moneyquest/shared';
import { SearchInput, Button, Card, Modal } from '../ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pencil, Trash2, Split, Receipt } from 'lucide-react';

interface TransactionListProps {
  transactions: TransactionWithSplits[];
  onEditTransaction: (transaction: TransactionWithSplits) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onSplitTransaction: (transactionId: string) => void;
  subscriptionTier: 'free' | 'plus' | 'premium';
}

export function TransactionList({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onSplitTransaction,
  subscriptionTier
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithSplits[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    transaction: TransactionWithSplits | null;
  }>({ isOpen: false, transaction: null });

  // Filter and sort transactions
  useEffect(() => {
    let filtered = transactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.originalAmount.toString().includes(searchTerm)
    );

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.originalAmount - b.originalAmount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.transaction) {
      onDeleteTransaction(deleteModal.transaction.id);
      setDeleteModal({ isOpen: false, transaction: null });
    }
  };

  const getTransactionTypeIcon = (transaction: TransactionWithSplits) => {
    if (transaction.splits && transaction.splits.length > 0) {
      return <Split className="h-4 w-4 text-blue-500" />;
    }
    if (subscriptionTier !== 'free') {
      return <Receipt className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getTransactionTypeColor = (originalAmount: number) => {
    return originalAmount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No transactions yet</h3>
            <p className="text-gray-600">Start by adding your first transaction to track your spending.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 text-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('date')}
              className={sortBy === 'date' ? 'bg-blue-50' : ''}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('amount')}
              className={sortBy === 'amount' ? 'bg-blue-50' : ''}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('description')}
              className={sortBy === 'description' ? 'bg-blue-50' : ''}
            >
              Description {sortBy === 'description' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                {/* Transaction Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      {getTransactionTypeIcon(transaction)}
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{formatDate(new Date(transaction.date))}</span>
                          {transaction.isParent && transaction.splits && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Split into {transaction.splits.length} parts
                            </span>
                          )}
                        </div>
                        {transaction.splits && transaction.splits.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {transaction.splits.map((split, index) => (
                              <div key={index} className="text-xs text-gray-500 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                <span>{split.description}</span>
                                <span>{formatCurrency(split.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`font-semibold ${getTransactionTypeColor(transaction.originalAmount)}`}>
                      {formatCurrency(transaction.originalAmount)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTransaction(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {!transaction.isParent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSplitTransaction(transaction.id)}
                        className="h-8 w-8 p-0"
                        title="Split transaction"
                      >
                        <Split className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteModal({ isOpen: true, transaction })}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && transactions.length > 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">No matching transactions</h3>
              <p className="text-gray-600">
                Try adjusting your search term to find transactions.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transaction: null })}
        title="Delete Transaction"
        description="This action cannot be undone. Are you sure you want to delete this transaction?"
      >
        <div className="space-y-4">
          {deleteModal.transaction && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium">{deleteModal.transaction.description}</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(deleteModal.transaction.originalAmount)} • {formatDate(new Date(deleteModal.transaction.date))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, transaction: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}