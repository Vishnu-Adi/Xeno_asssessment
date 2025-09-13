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

  try {
    // Get top customers by total spend (from orders)
    const topCustomers = await prisma.$queryRaw<{
      shopifyCustomerId: string;
      email: string;
      firstName: string;
      lastName: string;
      totalSpend: number;
      orderCount: number;
    }[]>`
      SELECT 
        c.shopifyCustomerId,
        c.email,
        c.firstName, 
        c.lastName,
        COALESCE(SUM(o.totalPrice), 0) as totalSpend,
        COUNT(o.id) as orderCount
      FROM Customer c
      LEFT JOIN \`Order\` o ON c.shopifyCustomerId = o.customerShopifyId 
        AND c.tenantId = o.tenantId
      WHERE c.tenantId = ${tenantId}
      GROUP BY c.id, c.shopifyCustomerId, c.email, c.firstName, c.lastName
      ORDER BY totalSpend DESC
      LIMIT 5
    `

    // Convert to safe JSON format
    const customers = topCustomers.map(customer => ({
      shopifyCustomerId: customer.shopifyCustomerId?.toString() || '',
      email: customer.email || 'No email',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      fullName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous',
      totalSpend: Number(customer.totalSpend || 0),
      orderCount: Number(customer.orderCount || 0),
      avgOrderValue: customer.orderCount > 0 ? Number(customer.totalSpend || 0) / Number(customer.orderCount) : 0
    }))

    return NextResponse.json(safeJson({ customers }))
  } catch (error) {
    console.error('Top customers query failed:', error)
    return NextResponse.json({ customers: [] })
  }
}

