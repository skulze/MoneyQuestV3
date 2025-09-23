import { PrismaClient } from '@prisma/client';

// Global is used here to maintain a cached connection across lambda invocations
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma client initialization for Lambda environments
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}