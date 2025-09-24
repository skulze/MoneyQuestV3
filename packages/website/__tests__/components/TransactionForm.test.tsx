import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionForm } from '@/components/TransactionForm';
import { useStore } from '@/lib/store';

// Mock the store
jest.mock('@/lib/store');
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const mockAddTransaction = jest.fn();
const mockAccounts = [
  { id: '1', name: 'Checking', type: 'CHECKING', balance: 1000, currencyId: '1' },
  { id: '2', name: 'Savings', type: 'SAVINGS', balance: 5000, currencyId: '1' }
];
const mockCategories = [
  { id: '1', name: 'Food', type: 'EXPENSE', color: '#FF5733' },
  { id: '2', name: 'Entertainment', type: 'EXPENSE', color: '#33FF57' }
];

beforeEach(() => {
  mockUseStore.mockReturnValue({
    accounts: mockAccounts,
    categories: mockCategories,
    addTransaction: mockAddTransaction,
  } as any);
  mockAddTransaction.mockClear();
});

describe('TransactionForm', () => {
  it('renders all form fields', () => {
    render(<TransactionForm />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('populates account and category dropdowns', () => {
    render(<TransactionForm />);

    fireEvent.click(screen.getByLabelText(/account/i));
    expect(screen.getByText('Checking')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/category/i));
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TransactionForm />);

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('validates amount is positive', async () => {
    render(<TransactionForm />);

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '-10' } });
    fireEvent.blur(amountInput);

    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<TransactionForm />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '25.50' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Lunch' } });

    // Select account
    fireEvent.click(screen.getByLabelText(/account/i));
    fireEvent.click(screen.getByText('Checking'));

    // Select category
    fireEvent.click(screen.getByLabelText(/category/i));
    fireEvent.click(screen.getByText('Food'));

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(mockAddTransaction).toHaveBeenCalledWith({
        amount: 25.50,
        description: 'Lunch',
        accountId: '1',
        categoryId: '1',
        date: expect.any(String),
        type: 'EXPENSE'
      });
    });
  });

  it('clears form after successful submission', async () => {
    render(<TransactionForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '25.50' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Lunch' } });

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/amount/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });

  it('handles transaction splitting', async () => {
    render(<TransactionForm />);

    // Enable splitting
    fireEvent.click(screen.getByLabelText(/split transaction/i));

    expect(screen.getByText(/add split/i)).toBeInTheDocument();

    // Add a split
    fireEvent.click(screen.getByText(/add split/i));

    const splitInputs = screen.getAllByLabelText(/split amount/i);
    expect(splitInputs).toHaveLength(1);
  });
});