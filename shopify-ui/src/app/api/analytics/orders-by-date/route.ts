import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
import { safeJson } from '@/lib/json'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const prisma = getPrisma()
  const url = new URL(req.url)
  const shop = url.searchParams.get('shop')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const status = url.searchParams.get('status') // 'pending', 'fulfilled', 'cancelled'
  
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })
  const tenantId = await resolveTenantIdFromShopDomain(shop)

  // Default to last 30 days if no dates provided
  const now = new Date()
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const start = startDate ? new Date(startDate) : defaultStart
  const end = endDate ? new Date(endDate) : now

  try {
    // Build dynamic where conditions
    let whereConditions = `tenantId = ${prisma.$queryRawUnsafe(`'${Buffer.from(tenantId).toString('hex')}'`)}`
    whereConditions += ` AND createdAt >= '${start.toISOString()}'`
    whereConditions += ` AND createdAt <= '${end.toISOString()}'`
    
    if (status && ['pending', 'fulfilled', 'cancelled'].includes(status)) {
      whereConditions += ` AND status = '${status}'`
    }

    // Get orders by date with aggregation (primary source)
    const where = Prisma.sql`
      WHERE tenantId = ${tenantId}
        AND createdAt >= ${start}
        AND createdAt <= ${end}
        ${status && ['pending', 'fulfilled', 'cancelled'].includes(status) ? Prisma.sql` AND status = ${status}` : Prisma.empty}
    `

    let ordersByDate = await prisma.$queryRaw<{
      date: string;
      orderCount: number;
      totalRevenue: number;
      avgOrderValue: number;
    }[]>(Prisma.sql`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as orderCount,
        SUM(totalPrice) as totalRevenue,
        AVG(totalPrice) as avgOrderValue
      FROM \`Order\`
      ${where}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `)

    // Fallback: if no orders present, infer from Checkout or Cart as pseudo-orders
    if (!ordersByDate || ordersByDate.length === 0) {
      const checkoutRows = await prisma.$queryRaw<{
        date: string; orderCount: number; totalRevenue: number; avgOrderValue: number;
      }[]>(Prisma.sql`
        SELECT DATE(createdAt) as date,
               COUNT(*) as orderCount,
               SUM(totalPrice) as totalRevenue,
               AVG(totalPrice) as avgOrderValue
        FROM Checkout
        WHERE tenantId = ${tenantId}
          AND createdAt >= ${start}
          AND createdAt <= ${end}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `)
      ordersByDate = checkoutRows
    }

    // Get individual orders for the period (limited to 50 most recent)
    const recentOrders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: start,
          lte: end
        },
        ...(status && ['pending', 'fulfilled', 'cancelled'].includes(status) && {
          status: status as 'pending' | 'fulfilled' | 'cancelled'
        })
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        shopifyOrderId: true,
        customerShopifyId: true,
        totalPrice: true,
        currency: true,
        status: true,
        createdAt: true
      }
    })

    // Convert to safe JSON
    const dateData = ordersByDate.map(row => ({
      date: String(row.date),
      orderCount: Number(row.orderCount || 0),
      totalRevenue: Number(row.totalRevenue || 0),
      avgOrderValue: Number(row.avgOrderValue || 0)
    }))

    const orders = recentOrders.map(order => ({
      id: order.id.toString(),
      shopifyOrderId: order.shopifyOrderId.toString(),
      customerShopifyId: order.customerShopifyId?.toString() || null,
      totalPrice: Number(order.totalPrice),
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    }))

    // Calculate summary stats
    const totalOrders = dateData.reduce((sum, day) => sum + day.orderCount, 0)
    const totalRevenue = dateData.reduce((sum, day) => sum + day.totalRevenue, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return NextResponse.json(safeJson({
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        status: status || 'all'
      },
      summary: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        daysInRange: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      chartData: dateData,
      recentOrders: orders
    }))
  } catch (error) {
    console.error('Orders by date query failed:', error)
    return NextResponse.json({ 
      dateRange: { start: start.toISOString(), end: end.toISOString(), status: status || 'all' },
      summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, daysInRange: 0 },
      chartData: [],
      recentOrders: []
    })
  }
}

