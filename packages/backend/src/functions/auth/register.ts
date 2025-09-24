import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminSetUserPasswordCommand,
  AdminConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { prisma } from '../../lib/database';
import { createAuthResponse } from '../../lib/auth';
import { z } from 'zod';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions')
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = registerSchema.parse(body);

    const { email, password, name } = validatedData;

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return createAuthResponse(400, {
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create user in Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'email_verified', Value: 'false' }
      ]
    });

    const signUpResponse = await cognitoClient.send(signUpCommand);

    if (!signUpResponse.UserSub) {
      throw new Error('Failed to create Cognito user');
    }

    // Create user in our database with free subscription
    const user = await prisma.user.create({
      data: {
        cognitoId: signUpResponse.UserSub,
        email,
        name,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: null, // Free tier doesn't expire
        preferences: {
          currency: 'USD',
          theme: 'light',
          notifications: {
            email: true,
            budgetAlerts: true,
            monthlyReports: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        subscription: true
      }
    });

    // Initialize default categories for the user
    await prisma.category.createMany({
      data: [
        { name: 'Food & Dining', type: 'EXPENSE', color: '#FF6B6B', isDefault: true, userId: user.id },
        { name: 'Transportation', type: 'EXPENSE', color: '#4ECDC4', isDefault: true, userId: user.id },
        { name: 'Shopping', type: 'EXPENSE', color: '#45B7D1', isDefault: true, userId: user.id },
        { name: 'Entertainment', type: 'EXPENSE', color: '#96CEB4', isDefault: true, userId: user.id },
        { name: 'Bills & Utilities', type: 'EXPENSE', color: '#FECA57', isDefault: true, userId: user.id },
        { name: 'Healthcare', type: 'EXPENSE', color: '#FF9FF3', isDefault: true, userId: user.id },
        { name: 'Salary', type: 'INCOME', color: '#6C5CE7', isDefault: true, userId: user.id },
        { name: 'Other Income', type: 'INCOME', color: '#A29BFE', isDefault: true, userId: user.id }
      ]
    });

    // Initialize default currencies
    await prisma.currency.createMany({
      data: [
        { code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
        { code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
        { code: 'GBP', name: 'British Pound', symbol: '£', isActive: true },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isActive: true }
      ],
      skipDuplicates: true // Don't create if they already exist
    });

    // Return user profile without sensitive data
    const userProfile = {
      id: user.id,
      cognitoId: user.cognitoId,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      needsEmailConfirmation: !signUpResponse.CodeDeliveryDetails?.Destination ? false : true
    };

    return createAuthResponse(201, {
      message: 'User registered successfully. Please check your email for confirmation code.',
      user: userProfile,
      needsEmailConfirmation: true
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return createAuthResponse(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    if (error.name === 'UsernameExistsException') {
      return createAuthResponse(400, {
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    if (error.name === 'InvalidPasswordException') {
      return createAuthResponse(400, {
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password does not meet requirements'
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user'
      }
    });
  }
}