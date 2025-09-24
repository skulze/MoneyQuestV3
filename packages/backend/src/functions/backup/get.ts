import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand, getSignedUrl } from '@aws-sdk/client-s3';
import { GetObjectCommand as GetObjectCommandType } from '@aws-sdk/client-s3';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const cognitoUser = await extractUserFromEvent(event);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoUser.cognitoId },
      select: { id: true, email: true }
    });

    if (!user) {
      return createAuthResponse(404, {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const backupId = event.pathParameters?.backupId;

    // If backupId is 'latest', get the most recent backup
    if (backupId === 'latest') {
      const latestBackup = await prisma.backup.findFirst({
        where: {
          userId: user.id,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!latestBackup) {
        return createAuthResponse(404, {
          error: {
            code: 'NO_BACKUPS_FOUND',
            message: 'No backups found for user'
          }
        });
      }

      return await generateBackupResponse(latestBackup);
    }

    // Get specific backup by ID
    if (backupId) {
      const backup = await prisma.backup.findFirst({
        where: {
          id: backupId,
          userId: user.id,
          isActive: true
        }
      });

      if (!backup) {
        return createAuthResponse(404, {
          error: {
            code: 'BACKUP_NOT_FOUND',
            message: 'Backup not found or access denied'
          }
        });
      }

      return await generateBackupResponse(backup);
    }

    // List all backups for user
    const backups = await prisma.backup.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        version: true,
        size: true,
        deviceId: true,
        deviceName: true,
        createdAt: true
      }
    });

    return createAuthResponse(200, {
      backups: backups,
      total: backups.length
    });

  } catch (error) {
    console.error('Backup retrieval error:', error);

    if (error instanceof AuthError) {
      return createAuthResponse(error.statusCode, {
        error: {
          code: 'AUTH_ERROR',
          message: error.message
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'BACKUP_RETRIEVAL_FAILED',
        message: 'Failed to retrieve backup'
      }
    });
  }
}

async function generateBackupResponse(backup: any) {
  try {
    // Generate signed URL for S3 download (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET!,
      Key: backup.s3Key
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    return createAuthResponse(200, {
      backup: {
        id: backup.id,
        version: backup.version,
        size: backup.size,
        checksum: backup.checksum,
        deviceId: backup.deviceId,
        deviceName: backup.deviceName,
        createdAt: backup.createdAt,
        downloadUrl: downloadUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
      }
    });

  } catch (error) {
    console.error('Error generating backup response:', error);
    throw error;
  }
}