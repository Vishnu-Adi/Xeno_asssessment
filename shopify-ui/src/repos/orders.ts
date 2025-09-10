import { Prisma, Order, PrismaClient } from '@prisma/client';
import { getPrisma } from '@/lib/db';
import { TenantScope } from '@/lib/tenant';

export type OrderStatus = string;

export async function listOrders(
  scope: TenantScope,
  params: { from?: Date; to?: Date; status?: OrderStatus; limit?: number; cursor?: string }
): Promise<{ items: Order[]; nextCursor: string | null }> {
  const prisma = getPrisma();
  const take = Math.min(params.limit ?? 25, 100);
  const createdAtFilter: Prisma.OrderWhereInput = {
    createdAt: {
      gte: params.from,
      lte: params.to,
    },
  };
  const where: Prisma.OrderWhereInput = {
    tenantId: scope.tenantId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.from || params.to ? createdAtFilter : {}),
  };
  const cursor = params.cursor ? { tenantId_orderId: { tenantId: scope.tenantId, orderId: Buffer.from(params.cursor, 'hex') } } : undefined;
  const items = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor, skip: 1 } : {}),
  });
  let nextCursor: string | null = null;
  if (items.length > take) {
    const next = items.pop()!;
    nextCursor = Buffer.from(next.orderId).toString('hex');
  }
  return { items, nextCursor };
}

export async function getOrder(scope: TenantScope, shopifyOrderId: bigint): Promise<Order | null> {
  const prisma = getPrisma();
  return prisma.order.findUnique({
    where: { tenantId_shopifyOrderId: { tenantId: scope.tenantId, shopifyOrderId } },
  });
}

export async function upsertFromShopify(
  scope: TenantScope,
  payload: any,
  client?: PrismaClient | Prisma.TransactionClient
): Promise<Order> {
  const prisma = (client ?? getPrisma());
  const createdAt = new Date(payload.created_at);
  const subtotal = new Prisma.Decimal(payload.current_subtotal_price ?? payload.subtotal_price ?? '0');
  const total = new Prisma.Decimal(payload.current_total_price ?? payload.total_price ?? '0');
  const currency: string = payload.currency ?? payload.presentment_currency ?? 'USD';
  const status: string = payload.financial_status ?? payload.fulfillment_status ?? 'unknown';
  return prisma.order.upsert({
    where: { tenantId_shopifyOrderId: { tenantId: scope.tenantId, shopifyOrderId: BigInt(payload.id) } },
    update: {
      status,
      subtotalPrice: subtotal,
      totalPrice: total,
      currency,
      createdAt,
    },
    create: {
      tenantId: scope.tenantId,
      orderId: cryptoRandomId(),
      shopifyOrderId: BigInt(payload.id),
      status,
      subtotalPrice: subtotal,
      totalPrice: total,
      currency,
      createdAt,
      updatedAt: new Date(),
    },
  });
}

function cryptoRandomId(): Buffer {
  const { randomBytes } = require('crypto');
  return randomBytes(16);
}


