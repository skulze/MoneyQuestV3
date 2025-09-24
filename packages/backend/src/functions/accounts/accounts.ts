import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER']),
  balance: z.number().default(0),
  currencyId: z.string().optional(),
  description: z.string().max(500, 'Description too long').optional()
});

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Account name too long').optional(),
  balance: z.number().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional()
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const cognitoUser = await extractUserFromEvent(event);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoUser.cognitoId },
      select: {
        id: true,
        subscriptionTier: true,
        _count: {
          select: { accounts: { where: { isActive: true } } }
        }
      }
    });

    if (!user) {
      return createAuthResponse(404, {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const method = event.httpMethod;
    const accountId = event.pathParameters?.accountId;

    switch (method) {
      case 'GET':
        return await handleGetAccounts(user.id, accountId);

      case 'POST':
        return await handleCreateAccount(user, event.body);

      case 'PUT':
        if (!accountId) {
          return createAuthResponse(400, {
            error: { code: 'MISSING_ACCOUNT_ID', message: 'Account ID is required' }
          });
        }
        return await handleUpdateAccount(user.id, accountId, event.body);

      case 'DELETE':
        if (!accountId) {
          return createAuthResponse(400, {
            error: { code: 'MISSING_ACCOUNT_ID', message: 'Account ID is required' }
          });
        }
        return await handleDeleteAccount(user.id, accountId);

      default:
        return createAuthResponse(405, {
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
        });
    }

  } catch (error) {
    console.error('Accounts API error:', error);

    if (error instanceof AuthError) {
      return createAuthResponse(error.statusCode, {
        error: { code: 'AUTH_ERROR', message: error.message }
      });
    }

    return createAuthResponse(500, {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
}

async function handleGetAccounts(userId: number, accountId?: string) {
  if (accountId) {
    // Get specific account
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId,
        isActive: true
      },
      include: {
        currency: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!account) {
      return createAuthResponse(404, {
        error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' }
      });
    }

    return createAuthResponse(200, { account });
  }

  // Get all accounts
  const accounts = await prisma.account.findMany({
    where: {
      userId: userId,
      isActive: true
    },
    include: {
      currency: true,
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return createAuthResponse(200, {
    accounts,
    summary: {
      totalAccounts: accounts.length,
      totalBalance: totalBalance
    }
  });
}

async function handleCreateAccount(user: any, body: string | null) {
  const parsedBody = JSON.parse(body || '{}');
  const validatedData = createAccountSchema.parse(parsedBody);

  // Check account limits
  const limits = {
    FREE: 3,
    PLUS: 5,
    PREMIUM: 10
  };

  const limit = limits[user.subscriptionTier as keyof typeof limits] || 3;

  if (user._count.accounts >= limit) {
    return createAuthResponse(403, {
      error: {
        code: 'ACCOUNT_LIMIT_EXCEEDED',
        message: `Account limit exceeded. Your ${user.subscriptionTier} tier allows ${limit} accounts.`,
        limit: limit,
        current: user._count.accounts
      }
    });
  }

  // Get default currency if not provided
  let currencyId = validatedData.currencyId;
  if (!currencyId) {
    const defaultCurrency = await prisma.currency.findFirst({
      where: { code: 'USD', isActive: true }
    });
    currencyId = defaultCurrency?.id;
  }

  const account = await prisma.account.create({
    data: {
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance,
      currencyId: currencyId,
      description: validatedData.description,
      userId: user.id,
      isActive: true
    },
    include: {
      currency: true
    }
  });

  return createAuthResponse(201, {
    message: 'Account created successfully',
    account
  });
}

async function handleUpdateAccount(userId: number, accountId: string, body: string | null) {
  const parsedBody = JSON.parse(body || '{}');
  const validatedData = updateAccountSchema.parse(parsedBody);

  // Verify account ownership
  const existingAccount = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: userId
    }
  });

  if (!existingAccount) {
    return createAuthResponse(404, {
      error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' }
    });
  }

  const account = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...validatedData,
      updatedAt: new Date()
    },
    include: {
      currency: true
    }
  });

  return createAuthResponse(200, {
    message: 'Account updated successfully',
    account
  });
}

async function handleDeleteAccount(userId: number, accountId: string) {
  // Verify account ownership
  const existingAccount = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: userId
    },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  if (!existingAccount) {
    return createAuthResponse(404, {
      error: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' }
    });
  }

  // Check if account has transactions
  if (existingAccount._count.transactions > 0) {
    // Soft delete - mark as inactive instead of hard delete
    await prisma.account.update({
      where: { id: accountId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return createAuthResponse(200, {
      message: 'Account deactivated successfully (has transaction history)'
    });
  }

  // Hard delete if no transactions
  await prisma.account.delete({
    where: { id: accountId }
  });

  return createAuthResponse(200, {
    message: 'Account deleted successfully'
  });
}