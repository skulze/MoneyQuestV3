import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  UpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';
import { z } from 'zod';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  preferences: z.object({
    currency: z.string().optional(),
    theme: z.enum(['light', 'dark']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      budgetAlerts: z.boolean().optional(),
      monthlyReports: z.boolean().optional()
    }).optional()
  }).optional()
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const cognitoUser = await extractUserFromEvent(event);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoUser.cognitoId },
      include: {
        subscription: true,
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            balance: true,
            isActive: true
          }
        },
        _count: {
          select: {
            transactions: true,
            budgets: true,
            categories: true
          }
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

    // Handle GET request - return user profile
    if (event.httpMethod === 'GET') {
      const profile = {
        id: user.id,
        cognitoId: user.cognitoId,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
        subscription: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
          expiresAt: user.subscriptionExpiresAt,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId
        },
        accounts: user.accounts,
        stats: {
          totalTransactions: user._count.transactions,
          totalBudgets: user._count.budgets,
          totalCategories: user._count.categories,
          accountsCount: user.accounts.length
        },
        limits: getSubscriptionLimits(user.subscriptionTier as 'FREE' | 'PLUS' | 'PREMIUM'),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return createAuthResponse(200, { profile });
    }

    // Handle PUT request - update user profile
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const validatedData = updateProfileSchema.parse(body);

      const updateData: any = {
        updatedAt: new Date()
      };

      // Update name if provided
      if (validatedData.name) {
        updateData.name = validatedData.name;

        // Also update name in Cognito
        try {
          const updateCognitoCommand = new UpdateUserAttributesCommand({
            AccessToken: event.headers.Authorization?.substring(7), // Remove 'Bearer '
            UserAttributes: [
              { Name: 'name', Value: validatedData.name }
            ]
          });
          await cognitoClient.send(updateCognitoCommand);
        } catch (cognitoError) {
          console.warn('Failed to update name in Cognito:', cognitoError);
          // Continue with database update even if Cognito update fails
        }
      }

      // Update preferences if provided
      if (validatedData.preferences) {
        // Merge with existing preferences
        const currentPreferences = user.preferences as any || {};
        updateData.preferences = {
          ...currentPreferences,
          ...validatedData.preferences,
          notifications: {
            ...currentPreferences.notifications,
            ...validatedData.preferences.notifications
          }
        };
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      return createAuthResponse(200, {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          preferences: updatedUser.preferences,
          updatedAt: updatedUser.updatedAt
        }
      });
    }

    // Method not allowed
    return createAuthResponse(405, {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });

  } catch (error) {
    console.error('Profile operation error:', error);

    if (error instanceof AuthError) {
      return createAuthResponse(error.statusCode, {
        error: {
          code: 'AUTH_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof z.ZodError) {
      return createAuthResponse(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'PROFILE_OPERATION_FAILED',
        message: 'Failed to perform profile operation'
      }
    });
  }
}

function getSubscriptionLimits(tier: 'FREE' | 'PLUS' | 'PREMIUM') {
  switch (tier) {
    case 'FREE':
      return {
        accounts: 3,
        users: 1,
        transactions: 1000,
        budgets: 5,
        categories: 20,
        features: {
          multiUser: false,
          ocr: false,
          plaidConnections: 0,
          prioritySupport: false
        }
      };
    case 'PLUS':
      return {
        accounts: 5,
        users: 10,
        transactions: 10000,
        budgets: 20,
        categories: 50,
        features: {
          multiUser: true,
          ocr: true,
          plaidConnections: 0,
          prioritySupport: true
        }
      };
    case 'PREMIUM':
      return {
        accounts: 10,
        users: 10,
        transactions: 100000,
        budgets: 100,
        categories: 100,
        features: {
          multiUser: true,
          ocr: true,
          plaidConnections: 10,
          prioritySupport: true
        }
      };
    default:
      return getSubscriptionLimits('FREE');
  }
}