import { handler } from '../../src/functions/accounts/accounts';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { prisma } from '../../src/lib/database';

// Mock the database
jest.mock('../../src/lib/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    currency: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('../../src/lib/auth', () => ({
  extractUserFromEvent: jest.fn().mockResolvedValue({ cognitoId: 'test-user' }),
  createAuthResponse: jest.fn().mockImplementation((status, body) => ({
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  })),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const createMockEvent = (
  method: string,
  body?: string,
  pathParameters?: Record<string, string>
): APIGatewayProxyEvent => ({
  httpMethod: method,
  body,
  pathParameters,
  headers: {
    Authorization: 'Bearer test-token',
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  requestContext: {} as any,
  resource: '',
  path: '',
  isBase64Encoded: false,
  multiValueHeaders: {},
  stageVariables: null,
});

const mockContext: Context = {} as Context;

beforeEach(() => {
  jest.clearAllMocks();

  // Default user mock
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 1,
    subscriptionTier: 'FREE',
    _count: { accounts: 2 },
  } as any);
});

describe('Accounts API Integration Tests', () => {
  describe('GET /accounts', () => {
    it('returns all user accounts', async () => {
      const mockAccounts = [
        {
          id: '1',
          name: 'Checking',
          type: 'CHECKING',
          balance: 1000,
          currency: { code: 'USD', symbol: '$' },
          _count: { transactions: 5 },
        },
        {
          id: '2',
          name: 'Savings',
          type: 'SAVINGS',
          balance: 5000,
          currency: { code: 'USD', symbol: '$' },
          _count: { transactions: 3 },
        },
      ];

      mockPrisma.account.findMany.mockResolvedValue(mockAccounts as any);

      const event = createMockEvent('GET');
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.accounts).toHaveLength(2);
      expect(body.summary.totalAccounts).toBe(2);
      expect(body.summary.totalBalance).toBe(6000);
    });

    it('returns specific account by ID', async () => {
      const mockAccount = {
        id: '1',
        name: 'Checking',
        type: 'CHECKING',
        balance: 1000,
        currency: { code: 'USD', symbol: '$' },
        _count: { transactions: 5 },
      };

      mockPrisma.account.findFirst.mockResolvedValue(mockAccount as any);

      const event = createMockEvent('GET', undefined, { accountId: '1' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.account.id).toBe('1');
      expect(body.account.name).toBe('Checking');
    });

    it('returns 404 for non-existent account', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const event = createMockEvent('GET', undefined, { accountId: 'non-existent' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('POST /accounts', () => {
    it('creates new account successfully', async () => {
      const requestBody = {
        name: 'New Checking',
        type: 'CHECKING',
        balance: 500,
        description: 'My new checking account',
      };

      const mockCurrency = { id: 'usd-1', code: 'USD' };
      const mockCreatedAccount = {
        id: 'new-account-1',
        ...requestBody,
        currencyId: 'usd-1',
        userId: 1,
        currency: mockCurrency,
      };

      mockPrisma.currency.findFirst.mockResolvedValue(mockCurrency as any);
      mockPrisma.account.create.mockResolvedValue(mockCreatedAccount as any);

      const event = createMockEvent('POST', JSON.stringify(requestBody));
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Account created successfully');
      expect(body.account.name).toBe('New Checking');
    });

    it('rejects account creation when limit exceeded', async () => {
      // Set user to have maximum accounts for FREE tier
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 3 }, // FREE tier limit is 3
      } as any);

      const requestBody = {
        name: 'Exceeding Account',
        type: 'CHECKING',
        balance: 0,
      };

      const event = createMockEvent('POST', JSON.stringify(requestBody));
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('ACCOUNT_LIMIT_EXCEEDED');
    });

    it('validates required fields', async () => {
      const invalidBody = {
        name: '', // Empty name should fail validation
        type: 'INVALID_TYPE',
      };

      const event = createMockEvent('POST', JSON.stringify(invalidBody));
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(400);
    });
  });

  describe('PUT /accounts/:accountId', () => {
    it('updates account successfully', async () => {
      const mockExistingAccount = {
        id: '1',
        name: 'Old Name',
        balance: 1000,
        userId: 1,
      };

      const updateData = {
        name: 'Updated Name',
        balance: 1500,
      };

      const mockUpdatedAccount = {
        ...mockExistingAccount,
        ...updateData,
        currency: { code: 'USD', symbol: '$' },
      };

      mockPrisma.account.findFirst.mockResolvedValue(mockExistingAccount as any);
      mockPrisma.account.update.mockResolvedValue(mockUpdatedAccount as any);

      const event = createMockEvent('PUT', JSON.stringify(updateData), { accountId: '1' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Account updated successfully');
      expect(body.account.name).toBe('Updated Name');
    });

    it('returns 404 for non-existent account update', async () => {
      mockPrisma.account.findFirst.mockResolvedValue(null);

      const event = createMockEvent('PUT', JSON.stringify({ name: 'Test' }), { accountId: 'non-existent' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /accounts/:accountId', () => {
    it('soft deletes account with transactions', async () => {
      const mockAccount = {
        id: '1',
        name: 'Test Account',
        userId: 1,
        _count: { transactions: 5 }, // Has transactions
      };

      mockPrisma.account.findFirst.mockResolvedValue(mockAccount as any);
      mockPrisma.account.update.mockResolvedValue({} as any);

      const event = createMockEvent('DELETE', undefined, { accountId: '1' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Account deactivated successfully (has transaction history)');
      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('hard deletes account without transactions', async () => {
      const mockAccount = {
        id: '1',
        name: 'Test Account',
        userId: 1,
        _count: { transactions: 0 }, // No transactions
      };

      mockPrisma.account.findFirst.mockResolvedValue(mockAccount as any);
      mockPrisma.account.delete.mockResolvedValue({} as any);

      const event = createMockEvent('DELETE', undefined, { accountId: '1' });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Account deleted successfully');
      expect(mockPrisma.account.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const event = createMockEvent('GET');
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('handles method not allowed', async () => {
      const event = createMockEvent('PATCH');
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(405);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });
});