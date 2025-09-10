// src/app/api/products/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const prisma = getPrisma()
  const url = new URL(req.url)
  const shop = url.searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })
  const tenantId = await resolveTenantIdFromShopDomain(shop)

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })
  return NextResponse.json({ items: products })
}
