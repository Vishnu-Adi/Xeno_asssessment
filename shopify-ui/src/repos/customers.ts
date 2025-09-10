import { Customer, PrismaClient, Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/db';
import { TenantScope } from '@/lib/tenant';

export async function listCustomers(scope: TenantScope, params: { from?: Date; to?: Date; limit?: number; cursor?: string }) {
  const prisma = getPrisma();
  const take = Math.min(params.limit ?? 25, 100);
  const where = {
    tenantId: scope.tenantId,
    ...(params.from || params.to
      ? { createdAt: { gte: params.from, lte: params.to } }
      : {}),
  } as const;
  const cursor = params.cursor ? { tenantId_customerId: { tenantId: scope.tenantId, customerId: Buffer.from(params.cursor, 'hex') } } : undefined;
  const items = await prisma.customer.findMany({ where, orderBy: [{ createdAt: 'desc' }], take: take + 1, ...(cursor ? { cursor, skip: 1 } : {}) });
  let nextCursor: string | null = null;
  if (items.length > take) {
    const next = items.pop()!;
    nextCursor = Buffer.from(next.customerId).toString('hex');
  }
  return { items, nextCursor };
}

export async function upsertFromShopify(
  scope: TenantScope,
  payload: any,
  client?: PrismaClient | Prisma.TransactionClient
): Promise<Customer> {
  const prisma = (client ?? getPrisma());
  return prisma.customer.upsert({
    where: { tenantId_shopifyCustomerId: { tenantId: scope.tenantId, shopifyCustomerId: BigInt(payload.id) } },
    update: {
      email: payload.email ?? null,
      firstName: payload.first_name ?? null,
      lastName: payload.last_name ?? null,
    },
    create: {
      tenantId: scope.tenantId,
      customerId: cryptoRandomId(),
      shopifyCustomerId: BigInt(payload.id),
      email: payload.email ?? null,
      firstName: payload.first_name ?? null,
      lastName: payload.last_name ?? null,
      createdAt: new Date(payload.created_at ?? Date.now()),
      updatedAt: new Date(),
    },
  });
}

function cryptoRandomId(): Buffer {
  const { randomBytes } = require('crypto');
  return randomBytes(16);
}


