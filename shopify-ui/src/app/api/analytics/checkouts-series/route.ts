// src/app/api/analytics/checkouts-series/route.ts
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

  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // MySQL: aggregate by DATE(createdAt)
  const rows = await prisma.$queryRaw<
    { day: string; revenue: number; checkouts: number }[]
  >`
    SELECT DATE(createdAt) AS day,
           SUM(totalPrice) AS revenue,
           COUNT(*) AS checkouts
    FROM Checkout
    WHERE tenantId = ${tenantId}
      AND createdAt >= ${d7}
    GROUP BY DATE(createdAt)
    ORDER BY day ASC;
  `
  return NextResponse.json(jsonBigInt(rows))
}
