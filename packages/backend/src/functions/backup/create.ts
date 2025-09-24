import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';
import { z } from 'zod';
import * as crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const backupSchema = z.object({
  data: z.string().min(1, 'Backup data is required'),
  version: z.number().int().min(1, 'Version must be a positive integer'),
  checksum: z.string().min(1, 'Checksum is required'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional()
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const cognitoUser = await extractUserFromEvent(event);

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = backupSchema.parse(body);

    const { data, version, checksum, deviceId, deviceName } = validatedData;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoUser.cognitoId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        _count: {
          select: {
            backups: true
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

    // Check backup limits based on subscription tier
    const backupLimits = {
      FREE: 5,
      PLUS: 25,
      PREMIUM: 100
    };

    const limit = backupLimits[user.subscriptionTier as keyof typeof backupLimits] || 5;

    if (user._count.backups >= limit) {
      return createAuthResponse(403, {
        error: {
          code: 'BACKUP_LIMIT_EXCEEDED',
          message: `Backup limit exceeded. Your ${user.subscriptionTier} tier allows ${limit} backups.`,
          limit: limit,
          current: user._count.backups
        }
      });
    }

    // Verify checksum
    const calculatedChecksum = crypto.createHash('sha256').update(data).digest('hex');
    if (calculatedChecksum !== checksum) {
      return createAuthResponse(400, {
        error: {
          code: 'CHECKSUM_MISMATCH',
          message: 'Data checksum verification failed'
        }
      });
    }

    // Generate unique backup ID and S3 key
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const s3Key = `backups/${user.id}/${backupId}.enc`;

    // Upload to S3 with encryption
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET!,
      Key: s3Key,
      Body: data,
      ServerSideEncryption: 'AES256',
      Metadata: {
        userId: user.id.toString(),
        version: version.toString(),
        checksum: checksum,
        timestamp: timestamp,
        deviceId: deviceId || 'unknown',
        deviceName: deviceName || 'unknown'
      },
      ContentType: 'application/octet-stream'
    });

    await s3Client.send(putObjectCommand);

    // Save backup record in database
    const backup = await prisma.backup.create({
      data: {
        id: backupId,
        userId: user.id,
        version: version,
        checksum: checksum,
        s3Key: s3Key,
        size: Buffer.byteLength(data, 'utf8'),
        deviceId: deviceId,
        deviceName: deviceName,
        createdAt: new Date(),
        isActive: true
      }
    });

    // Clean up old backups if over limit
    const backupsToDelete = await prisma.backup.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      skip: limit,
      select: { id: true, s3Key: true }
    });

    if (backupsToDelete.length > 0) {
      // Mark old backups as inactive
      await prisma.backup.updateMany({
        where: {
          id: { in: backupsToDelete.map(b => b.id) }
        },
        data: { isActive: false }
      });

      console.log(`Marked ${backupsToDelete.length} old backups as inactive for user ${user.id}`);
    }

    console.log(`Backup created successfully: ${backupId} for user ${user.email}`);

    return createAuthResponse(201, {
      message: 'Backup created successfully',
      backup: {
        id: backup.id,
        version: backup.version,
        size: backup.size,
        createdAt: backup.createdAt,
        deviceId: backup.deviceId,
        deviceName: backup.deviceName
      }
    });

  } catch (error) {
    console.error('Backup creation error:', error);

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
          message: 'Invalid backup data',
          details: error.errors
        }
      });
    }

    if (error.name === 'NoSuchBucket') {
      return createAuthResponse(500, {
        error: {
          code: 'STORAGE_ERROR',
          message: 'Backup storage not configured'
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'BACKUP_FAILED',
        message: 'Failed to create backup'
      }
    });
  }
}