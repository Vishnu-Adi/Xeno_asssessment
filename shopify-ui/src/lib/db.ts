import { getEnv } from './env';


const { PrismaClient } = require('@prisma/client');

declare global {
  var prisma: any | undefined;
}

export function getPrisma(): any {
  getEnv();
  if (global.prisma) return global.prisma;
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
  global.prisma = client;
  return client;
}


