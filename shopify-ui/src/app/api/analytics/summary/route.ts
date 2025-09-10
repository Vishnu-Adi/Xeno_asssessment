import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { resolveTenantIdFromShopDomain } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  const tenantId = await resolveTenantIdFromShopDomain(shop);
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const totals = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    _count: true,
    where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
  });
  const totalRevenue = totals._sum.totalPrice ?? 0;
  const ordersCount = totals._count;
  const aov = ordersCount ? Number(totalRevenue) / ordersCount : 0;
  return NextResponse.json({ totalRevenue, ordersCount, aov });
}


