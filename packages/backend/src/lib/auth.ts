import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent } from 'aws-lambda';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface AuthenticatedUser {
  cognitoId: string;
  email: string;
  sub: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function extractUserFromEvent(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const command = new GetUserCommand({ AccessToken: token });
    const response = await cognitoClient.send(command);

    const email = response.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
    const sub = response.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;

    if (!email || !sub) {
      throw new AuthError('Invalid user attributes');
    }

    return {
      cognitoId: sub,
      email,
      sub
    };
  } catch (error) {
    throw new AuthError('Invalid or expired token');
  }
}

export function createAuthResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}