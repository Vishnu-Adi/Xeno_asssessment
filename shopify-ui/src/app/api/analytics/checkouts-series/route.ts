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

  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let rows: { day: string; revenue: number; count: number }[] = []

  try {
    // Try Checkout data first
    const checkoutCount = await prisma.checkout.count({ where: { tenantId } }).catch(() => 0)
    
    if (checkoutCount > 0) {
      rows = await prisma.$queryRaw`
        SELECT DATE(createdAt) AS day,
               SUM(totalPrice) AS revenue,
               COUNT(*)        AS count
        FROM Checkout
        WHERE tenantId = ${tenantId} AND createdAt >= ${d7}
        GROUP BY DATE(createdAt)
        ORDER BY day ASC
      `
    } else {
      // Try Cart fallback
      try {
        const cartCount = await prisma.cart.count({ where: { tenantId } })
        if (cartCount > 0) {
          rows = await prisma.$queryRaw`
            SELECT DATE(createdAt) AS day,
                   SUM(totalPrice) AS revenue,
                   COUNT(*)        AS count
            FROM Cart
            WHERE tenantId = ${tenantId} AND createdAt >= ${d7}
            GROUP BY DATE(createdAt)
            ORDER BY day ASC
          `
        }
      } catch (error) {
        console.error('Cart series query failed:', error)
        // rows remains empty array
      }
    }
  } catch (error) {
    console.error('Series query failed:', error)
    // rows remains empty array
  }

  // Ensure numbers are plain numbers
  rows = rows.map(r => ({ day: String(r.day), revenue: Number(r.revenue ?? 0), count: Number(r.count ?? 0) }))
  return NextResponse.json(safeJson(rows))
}