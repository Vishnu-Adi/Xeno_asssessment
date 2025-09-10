import { PrismaClient } from '@prisma/client';
import { getEnv } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  // Ensure env parsed (side-effect to validate early)
  getEnv();
  if (global.prisma) return global.prisma;
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  global.prisma = client;
  return client;
}


