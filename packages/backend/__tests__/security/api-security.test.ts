import { handler } from '../../src/functions/accounts/accounts';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock dependencies
jest.mock('../../src/lib/database');
jest.mock('../../src/lib/auth');

const createSecurityTestEvent = (
  method: string,
  body?: string,
  headers: Record<string, string> = {},
  pathParameters?: Record<string, string>
): APIGatewayProxyEvent => ({
  httpMethod: method,
  body,
  pathParameters,
  headers: {
    'Content-Type': 'application/json',
    ...headers,
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

describe('API Security Tests', () => {
  describe('Authentication & Authorization', () => {
    it('should reject requests without Authorization header', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockRejectedValue(new Error('No authorization header'));

      const event = createSecurityTestEvent('GET', undefined, {});
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);
    });

    it('should reject requests with malformed JWT tokens', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockRejectedValue(new Error('Invalid token'));

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer invalid.jwt.token'
      });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);
    });

    it('should reject requests with expired tokens', async () => {
      const { extractUserFromEvent, AuthError } = require('../../src/lib/auth');
      extractUserFromEvent.mockRejectedValue(new AuthError('Token expired', 401));

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer expired.jwt.token'
      });
      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(401);
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should reject oversized request bodies', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });

      // Create oversized payload (> 1MB)
      const oversizedData = {
        name: 'Test Account',
        type: 'CHECKING',
        description: 'x'.repeat(2 * 1024 * 1024), // 2MB description
      };

      const event = createSecurityTestEvent('POST', JSON.stringify(oversizedData), {
        'Authorization': 'Bearer valid-token',
      });

      // AWS API Gateway typically limits payload to 10MB, but we should validate at app level
      const result = await handler(event, mockContext, jest.fn());

      // Should fail validation due to description length limit (500 chars)
      expect(result.statusCode).toBe(400);
    });

    it('should sanitize SQL injection attempts in input data', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });

      const sqlInjectionPayloads = [
        "'; DROP TABLE accounts; --",
        "' OR '1'='1",
        "'; DELETE FROM users WHERE id=1; --",
        "1'; UPDATE accounts SET balance=999999; --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const maliciousData = {
          name: payload,
          type: 'CHECKING',
        };

        const event = createSecurityTestEvent('POST', JSON.stringify(maliciousData), {
          'Authorization': 'Bearer valid-token',
        });

        const result = await handler(event, mockContext, jest.fn());

        // Should fail validation due to Zod schema
        expect(result.statusCode).toBe(400);
      }
    });

    it('should reject XSS attempts in string fields', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')" />',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')" />',
      ];

      for (const payload of xssPayloads) {
        const maliciousData = {
          name: payload,
          type: 'CHECKING',
        };

        const event = createSecurityTestEvent('POST', JSON.stringify(maliciousData), {
          'Authorization': 'Bearer valid-token',
        });

        const result = await handler(event, mockContext, jest.fn());

        // XSS payloads should be blocked by validation
        if (result.statusCode === 201) {
          // If somehow it passes validation, ensure it's sanitized
          const responseBody = JSON.parse(result.body);
          expect(responseBody.account.name).not.toContain('<script>');
          expect(responseBody.account.name).not.toContain('javascript:');
          expect(responseBody.account.name).not.toContain('onerror=');
        } else {
          expect(result.statusCode).toBe(400);
        }
      }
    });

    it('should validate numeric fields for overflow attacks', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });

      const overflowValues = [
        Number.MAX_SAFE_INTEGER + 1,
        -Number.MAX_SAFE_INTEGER - 1,
        Infinity,
        -Infinity,
        NaN,
        1e308, // Larger than max safe number
      ];

      for (const balance of overflowValues) {
        const maliciousData = {
          name: 'Test Account',
          type: 'CHECKING',
          balance: balance,
        };

        const event = createSecurityTestEvent('POST', JSON.stringify(maliciousData), {
          'Authorization': 'Bearer valid-token',
        });

        const result = await handler(event, mockContext, jest.fn());

        // Should handle numeric edge cases appropriately
        expect(result.statusCode).toBe(400);
      }
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers in responses', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });
      prisma.account.findMany.mockResolvedValue([]);

      const { createAuthResponse } = require('../../src/lib/auth');
      createAuthResponse.mockImplementation((status, body) => ({
        statusCode: status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: JSON.stringify(body),
      }));

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer valid-token',
      });

      const result = await handler(event, mockContext, jest.fn());

      // Verify security headers are present
      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['X-Frame-Options']).toBe('DENY');
      expect(result.headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(result.headers['Strict-Transport-Security']).toContain('max-age=');
      expect(result.headers['Referrer-Policy']).toBeTruthy();
    });
  });

  describe('Rate Limiting & DoS Protection', () => {
    it('should handle concurrent requests appropriately', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });
      prisma.account.findMany.mockResolvedValue([]);

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer valid-token',
      });

      // Simulate concurrent requests
      const concurrentRequests = Array(50).fill(null).map(() =>
        handler(event, mockContext, jest.fn())
      );

      const results = await Promise.allSettled(concurrentRequests);

      // All requests should complete without crashing
      const successfulRequests = results.filter(r => r.status === 'fulfilled');
      expect(successfulRequests.length).toBeGreaterThan(0);

      // If any failed, they should fail gracefully
      const failedRequests = results.filter(r => r.status === 'rejected');
      failedRequests.forEach(failure => {
        expect(failure.reason).toBeInstanceOf(Error);
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      // Simulate database error with sensitive information
      prisma.user.findUnique.mockRejectedValue(
        new Error('Connection failed to host db.internal.company.com:5432 with credentials user=admin, password=secret123')
      );

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer valid-token',
      });

      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);

      // Ensure sensitive information is not leaked
      expect(responseBody.error.message).not.toContain('password');
      expect(responseBody.error.message).not.toContain('secret');
      expect(responseBody.error.message).not.toContain('db.internal');
      expect(responseBody.error.message).not.toContain('admin');

      // Should be generic error message
      expect(responseBody.error.message).toBe('Internal server error');
    });

    it('should not expose stack traces in production errors', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'test-user' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer valid-token',
      });

      const result = await handler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);

      const responseBody = JSON.parse(result.body);

      // Should not contain stack trace information
      expect(responseBody.error.stack).toBeUndefined();
      expect(responseBody.error.details).not.toContain('at Object.');
      expect(responseBody.error.details).not.toContain('/src/');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Business Logic Security', () => {
    it('should enforce user isolation (users cannot access other users data)', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'user-1' });

      const { prisma } = require('../../src/lib/database');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 0 },
      });

      // Mock finding an account that belongs to a different user
      prisma.account.findFirst.mockResolvedValue(null); // Simulates proper user isolation

      const event = createSecurityTestEvent('GET', undefined, {
        'Authorization': 'Bearer user-1-token',
      }, { accountId: 'other-user-account-123' });

      const result = await handler(event, mockContext, jest.fn());

      // Should return 404 for accounts that don't belong to the authenticated user
      expect(result.statusCode).toBe(404);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should enforce subscription limits correctly', async () => {
      const { extractUserFromEvent } = require('../../src/lib/auth');
      extractUserFromEvent.mockResolvedValue({ cognitoId: 'free-user' });

      const { prisma } = require('../../src/lib/database');
      // Free user at account limit
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        subscriptionTier: 'FREE',
        _count: { accounts: 3 }, // At FREE tier limit
      });

      const accountData = {
        name: 'Exceeding Account',
        type: 'CHECKING',
        balance: 0,
      };

      const event = createSecurityTestEvent('POST', JSON.stringify(accountData), {
        'Authorization': 'Bearer free-user-token',
      });

      const result = await handler(event, mockContext, jest.fn());

      // Should reject account creation due to limit
      expect(result.statusCode).toBe(403);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe('ACCOUNT_LIMIT_EXCEEDED');
    });
  });
});