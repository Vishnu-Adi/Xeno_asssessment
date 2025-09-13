import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
import { safeJson } from '@/lib/json'
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

  // Convert BigInt fields to strings to avoid JSON serialization errors
  const items = products.map(product => ({
    id: product.id.toString(),
    tenantId: Buffer.from(product.tenantId).toString('hex'),
    shopifyProductId: product.shopifyProductId.toString(),
    title: product.title,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  }))

  return NextResponse.json({ items })
}