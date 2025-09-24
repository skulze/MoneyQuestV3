import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { prisma } from '../../lib/database';
import { createAuthResponse } from '../../lib/auth';
import { z } from 'zod';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const confirmSchema = z.object({
  email: z.string().email('Invalid email format'),
  confirmationCode: z.string().min(6, 'Confirmation code must be at least 6 characters')
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = confirmSchema.parse(body);

    const { email, confirmationCode } = validatedData;

    // Confirm sign up in Cognito
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: confirmationCode
    });

    await cognitoClient.send(confirmCommand);

    // Update user email verification status in our database
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        updatedAt: new Date()
      }
    });

    if (!user) {
      return createAuthResponse(404, {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database'
        }
      });
    }

    // Mark email as verified in Cognito (admin action)
    try {
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email,
        UserAttributes: [
          { Name: 'email_verified', Value: 'true' }
        ]
      });

      await cognitoClient.send(updateAttributesCommand);
    } catch (adminError) {
      console.warn('Failed to update email_verified attribute in Cognito:', adminError);
      // Continue anyway, as the main confirmation succeeded
    }

    return createAuthResponse(200, {
      message: 'Email confirmed successfully. You can now sign in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Email confirmation error:', error);

    if (error instanceof z.ZodError) {
      return createAuthResponse(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    if (error.name === 'CodeMismatchException') {
      return createAuthResponse(400, {
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid confirmation code'
        }
      });
    }

    if (error.name === 'ExpiredCodeException') {
      return createAuthResponse(400, {
        error: {
          code: 'EXPIRED_CODE',
          message: 'Confirmation code has expired'
        }
      });
    }

    if (error.name === 'UserNotFoundException') {
      return createAuthResponse(404, {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'CONFIRMATION_FAILED',
        message: 'Failed to confirm email'
      }
    });
  }
}