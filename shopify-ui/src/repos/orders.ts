import { getPrisma } from '@/lib/db';
import { TenantScope } from '@/lib/tenant';

type OrderStatus = 'pending' | 'fulfilled' | 'cancelled';

type Order = {
  id: string;
  tenantId: string;
  shopifyOrderId: bigint;
  customerShopifyId: bigint | null;
  totalPrice: any; // Decimal
  currency: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export async function listOrders(
  scope: TenantScope,
  params: { from?: Date; to?: Date; status?: OrderStatus; limit?: number; cursor?: string }
): Promise<{ items: Order[]; nextCursor: string | null }> {
  const prisma = getPrisma();
  const take = Math.min(params.limit ?? 25, 100);
  const createdAtFilter: any = {
    createdAt: {
      gte: params.from,
      lte: params.to,
    },
  };
  const where: any = {
    tenantId: scope.tenantId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.from || params.to ? createdAtFilter : {}),
  };
  const cursor = params.cursor ? { id: BigInt(params.cursor) } : undefined;
  const items = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor, skip: 1 } : {}),
  });
  let nextCursor: string | null = null;
  if (items.length > take) {
    const next = items.pop()!;
    nextCursor = String(next.id);
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
  payload: { id: string; created_at: string; current_total_price?: string; total_price?: string; currency?: string; presentment_currency?: string; financial_status?: string; customer?: { id: string } },
  client?: any
): Promise<Order> {
  const prisma = (client ?? getPrisma());
  const createdAt = new Date(payload.created_at);
  const total = parseFloat(payload.current_total_price ?? payload.total_price ?? '0');
  const currency: string = payload.currency ?? payload.presentment_currency ?? 'USD';
  const status: OrderStatus = payload.financial_status === 'paid' ? 'fulfilled' : 'pending';
  return prisma.order.upsert({
    where: { tenantId_shopifyOrderId: { tenantId: scope.tenantId, shopifyOrderId: BigInt(payload.id) } },
    update: {
      status,
      totalPrice: total,
      currency,
      createdAt,
    },
    create: {
      tenantId: scope.tenantId,
      shopifyOrderId: BigInt(payload.id),
      customerShopifyId: payload.customer?.id ? BigInt(payload.customer.id) : null,
      status,
      totalPrice: total,
      currency,
      createdAt,
    },
  });
}



