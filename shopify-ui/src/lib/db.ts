import { PrismaClient } from '@prisma/client';
import { getEnv } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {

  getEnv();
  if (global.prisma) return global.prisma;
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  global.prisma = client;
  return client;
}


