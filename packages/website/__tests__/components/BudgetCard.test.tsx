import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BudgetCard } from '@/components/BudgetCard';

const mockBudget = {
  id: '1',
  categoryId: '1',
  category: { name: 'Food', color: '#FF5733' },
  amount: 500,
  spent: 320,
  period: 'MONTHLY' as const,
  startDate: '2024-01-01',
  currencyId: '1',
  currency: { code: 'USD', symbol: '$' }
};

describe('BudgetCard', () => {
  it('renders budget information correctly', () => {
    render(<BudgetCard budget={mockBudget} />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$320.00 / $500.00')).toBeInTheDocument();
    expect(screen.getByText('Monthly Budget')).toBeInTheDocument();
  });

  it('displays correct percentage spent', () => {
    render(<BudgetCard budget={mockBudget} />);

    expect(screen.getByText('64% spent')).toBeInTheDocument();
  });

  it('shows warning when over 80% spent', () => {
    const overBudget = {
      ...mockBudget,
      spent: 450 // 90% of 500
    };

    const { container } = render(<BudgetCard budget={overBudget} />);

    expect(container.firstChild).toHaveClass('border-yellow-500');
    expect(screen.getByText('90% spent')).toBeInTheDocument();
  });

  it('shows error when budget exceeded', () => {
    const exceededBudget = {
      ...mockBudget,
      spent: 600 // 120% of 500
    };

    const { container } = render(<BudgetCard budget={exceededBudget} />);

    expect(container.firstChild).toHaveClass('border-red-500');
    expect(screen.getByText('120% spent')).toBeInTheDocument();
    expect(screen.getByText('Over budget by $100.00')).toBeInTheDocument();
  });

  it('displays progress bar with correct width', () => {
    render(<BudgetCard budget={mockBudget} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 64%');
  });

  it('handles zero budget amount', () => {
    const zeroBudget = {
      ...mockBudget,
      amount: 0,
      spent: 0
    };

    render(<BudgetCard budget={zeroBudget} />);

    expect(screen.getByText('$0.00 / $0.00')).toBeInTheDocument();
    expect(screen.getByText('0% spent')).toBeInTheDocument();
  });

  it('formats different currencies correctly', () => {
    const euroBudget = {
      ...mockBudget,
      currency: { code: 'EUR', symbol: '€' }
    };

    render(<BudgetCard budget={euroBudget} />);

    expect(screen.getByText('€320.00 / €500.00')).toBeInTheDocument();
  });

  it('displays different periods correctly', () => {
    const weeklyBudget = {
      ...mockBudget,
      period: 'WEEKLY' as const
    };

    render(<BudgetCard budget={weeklyBudget} />);

    expect(screen.getByText('Weekly Budget')).toBeInTheDocument();
  });
});