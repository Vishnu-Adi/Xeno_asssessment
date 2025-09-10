import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
export const runtime = 'nodejs'

// ✅ helper: convert any BigInt to string for JSON
function jsonBigInt<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  )
}

export async function GET(req: NextRequest) {
  const prisma = getPrisma()
  const url = new URL(req.url)
  const shop = url.searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  const tenantId = await resolveTenantIdFromShopDomain(shop)

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  // ✅ return JSON-safe objects
  return NextResponse.json({ items: jsonBigInt(products) })
}
