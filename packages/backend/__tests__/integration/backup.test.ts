import { handler as createHandler } from '../../src/functions/backup/create';
import { handler as getHandler } from '../../src/functions/backup/get';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { prisma } from '../../src/lib/database';
import { S3Client } from '@aws-sdk/client-s3';

// Mock the database and S3
jest.mock('../../src/lib/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    backup: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  getSignedUrl: jest.fn().mockResolvedValue('https://test-url.com/signed'),
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

// Mock crypto
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-checksum'),
  }),
  randomUUID: jest.fn().mockReturnValue('test-backup-id'),
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
    email: 'test@example.com',
    subscriptionTier: 'FREE',
    _count: { backups: 2 },
  } as any);
});

describe('Backup API Integration Tests', () => {
  describe('POST /backup (Create Backup)', () => {
    it('creates backup successfully', async () => {
      const backupData = {
        data: JSON.stringify({ transactions: [], accounts: [] }),
        version: 1,
        checksum: 'test-checksum',
        deviceId: 'device-123',
        deviceName: 'iPhone 12',
      };

      const mockCreatedBackup = {
        id: 'test-backup-id',
        userId: 1,
        version: 1,
        size: 100,
        createdAt: new Date(),
        deviceId: 'device-123',
        deviceName: 'iPhone 12',
      };

      mockPrisma.backup.create.mockResolvedValue(mockCreatedBackup as any);
      mockPrisma.backup.findMany.mockResolvedValue([]); // No old backups to clean up

      const event = createMockEvent('POST', JSON.stringify(backupData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Backup created successfully');
      expect(body.backup.id).toBe('test-backup-id');
    });

    it('rejects backup when limit exceeded', async () => {
      // Set user to have maximum backups for FREE tier
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        subscriptionTier: 'FREE',
        _count: { backups: 5 }, // FREE tier limit is 5
      } as any);

      const backupData = {
        data: JSON.stringify({ test: 'data' }),
        version: 1,
        checksum: 'test-checksum',
      };

      const event = createMockEvent('POST', JSON.stringify(backupData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('BACKUP_LIMIT_EXCEEDED');
    });

    it('validates checksum correctly', async () => {
      const backupData = {
        data: JSON.stringify({ test: 'data' }),
        version: 1,
        checksum: 'wrong-checksum', // This won't match the mocked checksum
        deviceId: 'device-123',
      };

      const event = createMockEvent('POST', JSON.stringify(backupData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('CHECKSUM_MISMATCH');
    });

    it('validates required fields', async () => {
      const invalidData = {
        version: 1,
        // Missing required fields: data, checksum
      };

      const event = createMockEvent('POST', JSON.stringify(invalidData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('cleans up old backups when limit reached', async () => {
      const backupData = {
        data: JSON.stringify({ test: 'data' }),
        version: 1,
        checksum: 'test-checksum',
      };

      const oldBackups = [
        { id: 'old-backup-1', s3Key: 'backups/1/old-backup-1.enc' },
        { id: 'old-backup-2', s3Key: 'backups/1/old-backup-2.enc' },
      ];

      mockPrisma.backup.create.mockResolvedValue({
        id: 'new-backup-id',
        userId: 1,
        version: 1,
        size: 100,
        createdAt: new Date(),
      } as any);

      mockPrisma.backup.findMany.mockResolvedValue(oldBackups as any);
      mockPrisma.backup.updateMany.mockResolvedValue({ count: 2 } as any);

      const event = createMockEvent('POST', JSON.stringify(backupData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(201);
      expect(mockPrisma.backup.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['old-backup-1', 'old-backup-2'] },
        },
        data: { isActive: false },
      });
    });
  });

  describe('GET /backup (Get Backups)', () => {
    it('returns all user backups', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          version: 2,
          size: 1024,
          deviceId: 'device-1',
          deviceName: 'iPhone 12',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'backup-2',
          version: 1,
          size: 512,
          deviceId: 'device-1',
          deviceName: 'iPhone 12',
          createdAt: new Date('2024-01-10'),
        },
      ];

      mockPrisma.backup.findMany.mockResolvedValue(mockBackups as any);

      const event = createMockEvent('GET');
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.backups).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it('returns latest backup when requested', async () => {
      const mockLatestBackup = {
        id: 'latest-backup',
        version: 3,
        size: 2048,
        checksum: 'checksum-123',
        s3Key: 'backups/1/latest-backup.enc',
        deviceId: 'device-1',
        deviceName: 'iPhone 12',
        createdAt: new Date('2024-01-20'),
      };

      mockPrisma.backup.findFirst.mockResolvedValue(mockLatestBackup as any);

      const event = createMockEvent('GET', undefined, { backupId: 'latest' });
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.backup.id).toBe('latest-backup');
      expect(body.backup.downloadUrl).toBe('https://test-url.com/signed');
      expect(body.backup.expiresAt).toBeDefined();
    });

    it('returns specific backup by ID', async () => {
      const mockBackup = {
        id: 'specific-backup',
        version: 2,
        size: 1024,
        checksum: 'checksum-456',
        s3Key: 'backups/1/specific-backup.enc',
        deviceId: 'device-1',
        deviceName: 'iPhone 12',
        createdAt: new Date('2024-01-18'),
      };

      mockPrisma.backup.findFirst.mockResolvedValue(mockBackup as any);

      const event = createMockEvent('GET', undefined, { backupId: 'specific-backup' });
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.backup.id).toBe('specific-backup');
      expect(body.backup.downloadUrl).toBe('https://test-url.com/signed');
    });

    it('returns 404 when backup not found', async () => {
      mockPrisma.backup.findFirst.mockResolvedValue(null);

      const event = createMockEvent('GET', undefined, { backupId: 'non-existent' });
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('BACKUP_NOT_FOUND');
    });

    it('returns 404 when no backups exist for latest request', async () => {
      mockPrisma.backup.findFirst.mockResolvedValue(null);

      const event = createMockEvent('GET', undefined, { backupId: 'latest' });
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('NO_BACKUPS_FOUND');
    });
  });

  describe('Error Handling', () => {
    it('handles S3 errors gracefully', async () => {
      const mockS3Error = new Error('S3 connection failed');
      mockS3Error.name = 'NoSuchBucket';

      const mockS3Client = new S3Client({});
      (mockS3Client.send as jest.Mock).mockRejectedValue(mockS3Error);

      const backupData = {
        data: JSON.stringify({ test: 'data' }),
        version: 1,
        checksum: 'test-checksum',
      };

      const event = createMockEvent('POST', JSON.stringify(backupData));
      const result = await createHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('STORAGE_ERROR');
    });

    it('handles database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const event = createMockEvent('GET');
      const result = await getHandler(event, mockContext, jest.fn());

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('BACKUP_RETRIEVAL_FAILED');
    });
  });
});