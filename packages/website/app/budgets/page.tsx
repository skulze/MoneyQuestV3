'use client';

import { useState, useEffect } from 'react';
import { useDataEngine } from '@/hooks/useDataEngine';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, CurrencyInput } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit, Trash2, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  spent?: number;
  remaining?: number;
  percentUsed?: number;
  status?: 'on_track' | 'warning' | 'exceeded';
  createdAt: string;
  updatedAt: string;
}

export default function BudgetsPage() {
  const { session, isLoading: authLoading } = useAuthGuard('/budgets');
  const { dataEngine, stats, refreshStats, addBudget, subscriptionTier } = useDataEngine();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Budget Modal
  const [addModal, setAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    categoryId: '',
    amount: 0,
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Budget Modal
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    budget: Budget | null;
  }>({ isOpen: false, budget: null });

  // Delete Budget Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    budget: Budget | null;
  }>({ isOpen: false, budget: null });

  // Load budgets when data engine is ready
  useEffect(() => {
    if (!dataEngine || !session?.user?.id) return;

    const loadBudgets = async () => {
      setIsLoading(true);
      try {
        const fetchedBudgets = await dataEngine.getBudgets(session.user.id);

        // Enhance budgets with spending data and category names
        const enhancedBudgets = await Promise.all(
          fetchedBudgets.map(async (budget: any) => {
            // Get category name
            const category = stats.categories.find((cat: any) => cat.id === budget.categoryId);

            // Calculate spending for this budget period
            // TODO: This would need to be implemented in LocalDataEngine
            const spent = 0; // Placeholder
            const remaining = budget.amount - spent;
            const percentUsed = (spent / budget.amount) * 100;

            let status: 'on_track' | 'warning' | 'exceeded' = 'on_track';
            if (percentUsed >= 100) status = 'exceeded';
            else if (percentUsed >= 75) status = 'warning';

            return {
              ...budget,
              categoryName: category?.name || 'Unknown Category',
              spent,
              remaining,
              percentUsed,
              status
            };
          })
        );

        setBudgets(enhancedBudgets);
      } catch (error) {
        console.error('Failed to load budgets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, [dataEngine, session?.user?.id, stats.categories]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataEngine || !session?.user?.id) return;

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!addFormData.categoryId) newErrors.categoryId = 'Category is required';
    if (addFormData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const budget = await addBudget({
        categoryId: addFormData.categoryId,
        amount: addFormData.amount,
        period: addFormData.period,
        startDate: addFormData.startDate
      });

      if (budget) {
        // Refresh budget list
        const updatedBudgets = await dataEngine.getBudgets(session.user.id);
        setBudgets(updatedBudgets);

        // Reset form and close modal
        setAddFormData({
          categoryId: '',
          amount: 0,
          period: 'monthly',
          startDate: new Date().toISOString().split('T')[0]
        });
        setFormErrors({});
        setAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add budget:', error);
      setFormErrors({ submit: 'Failed to add budget. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditModal({ isOpen: true, budget });
  };

  const handleDeleteBudget = async (budget: Budget) => {
    if (!dataEngine) return;

    try {
      // TODO: Implement deleteBudget in LocalDataEngine
      // await dataEngine.deleteBudget(budget.id);

      // Refresh budget list
      const updatedBudgets = await dataEngine.getBudgets(session?.user?.id || '');
      setBudgets(updatedBudgets);

      setDeleteModal({ isOpen: false, budget: null });
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getBudgetStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded': return <AlertCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
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
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-1">
              Set spending limits and track your financial goals
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Budget
            </Button>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-700 text-sm font-medium">Total Budgets</div>
            <div className="text-blue-900 text-2xl font-bold">{stats.budgetCount}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-700 text-sm font-medium">On Track</div>
            <div className="text-green-900 text-2xl font-bold">
              {budgets.filter(b => b.status === 'on_track').length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-700 text-sm font-medium">Over Budget</div>
            <div className="text-red-900 text-2xl font-bold">
              {budgets.filter(b => b.status === 'exceeded').length}
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : budgets.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No budgets yet</h3>
              <p className="text-gray-600">Create your first budget to start tracking your spending goals.</p>
            </div>
            <Button
              onClick={() => setAddModal(true)}
              className="mt-4"
            >
              Create Your First Budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.categoryName}</CardTitle>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(budget.status || 'on_track')}`}>
                    {getBudgetStatusIcon(budget.status || 'on_track')}
                    {budget.status === 'exceeded' ? 'Over Budget' : budget.status === 'warning' ? 'Warning' : 'On Track'}
                  </div>
                </div>
                <div className="text-sm text-gray-500 capitalize">{budget.period}ly budget</div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Budget Amount */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budget.amount)}
                  </div>
                  <div className="text-sm text-gray-500">Budget limit</div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className="font-medium">{formatCurrency(budget.spent || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (budget.percentUsed || 0) >= 100
                          ? 'bg-red-500'
                          : (budget.percentUsed || 0) >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentUsed || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className={`font-medium ${(budget.remaining || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.remaining || 0)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditBudget(budget)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, budget })}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => !isSubmitting && setAddModal(false)}
        title="Create New Budget"
        description="Set up a spending limit for a specific category."
      >
        <form onSubmit={handleAddBudget} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={addFormData.categoryId}
              onChange={(e) => setAddFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {stats.categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>
            )}
          </div>

          {/* Budget Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount *
            </label>
            <CurrencyInput
              value={addFormData.amount}
              onChange={(value) => setAddFormData(prev => ({ ...prev, amount: value }))}
              placeholder="0.00"
              error={formErrors.amount}
              disabled={isSubmitting}
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Period *
            </label>
            <div className="flex gap-4">
              {[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="period"
                    value={option.value}
                    checked={addFormData.period === option.value}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, period: e.target.value as any }))}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <Input
              type="date"
              value={addFormData.startDate}
              onChange={(e) => setAddFormData(prev => ({ ...prev, startDate: e.target.value }))}
              disabled={isSubmitting}
            />
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
              {isSubmitting ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Budget Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, budget: null })}
        title="Delete Budget"
        description="This action cannot be undone. Are you sure you want to delete this budget?"
      >
        <div className="space-y-4">
          {deleteModal.budget && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium">{deleteModal.budget.categoryName}</div>
              <div className="text-sm text-gray-600">
                {formatCurrency(deleteModal.budget.amount)} {deleteModal.budget.period}ly
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, budget: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteModal.budget && handleDeleteBudget(deleteModal.budget)}
            >
              Delete Budget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}