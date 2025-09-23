import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const user = await extractUserFromEvent(event);

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { cognitoId: user.cognitoId }
    });

    if (!dbUser) {
      return createAuthResponse(404, { error: 'User not found' });
    }

    // Get query parameters
    const { accountId, limit = '50', offset = '0' } = event.queryStringParameters || {};

    // Build query
    const whereClause: any = {
      account: {
        userId: dbUser.id
      }
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
        category: true,
        splits: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return createAuthResponse(200, {
      transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: transactions.length
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof AuthError) {
      return createAuthResponse(error.statusCode, { error: error.message });
    }

    return createAuthResponse(500, { error: 'Internal server error' });
  }
}