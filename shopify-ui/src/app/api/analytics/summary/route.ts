// src/app/api/analytics/summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
import { Prisma } from '@prisma/client'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const prisma = getPrisma()
  const url = new URL(req.url)
  const shop = url.searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  const tenantId = await resolveTenantIdFromShopDomain(shop)

  const now = new Date()
  const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const [productCount, newProducts7d, activeCheckouts24h, checkoutSum24h, created7d, completed7d] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId, createdAt: { gte: d7 } } }),
    prisma.checkout.count({ where: { tenantId, createdAt: { gte: d24 } } }),
    prisma.checkout.aggregate({ where: { tenantId, createdAt: { gte: d24 } }, _sum: { totalPrice: true } }),
    prisma.checkout.count({ where: { tenantId, createdAt: { gte: d7 } } }),
    prisma.checkout.count({ where: { tenantId, completedAt: { gte: d7 } } }),
  ])

  const checkoutValue24h = Number((checkoutSum24h._sum.totalPrice as Prisma.Decimal | null) ?? 0)
  const completionRate7d = created7d > 0 ? completed7d / created7d : 0

  return NextResponse.json({
    productCount,
    newProducts7d,
    activeCheckouts24h,
    checkoutValue24h,
    completionRate7d
  })
}