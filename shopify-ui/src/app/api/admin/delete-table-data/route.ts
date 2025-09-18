import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'

export const runtime = 'nodejs'

// Allowed tables for deletion to prevent SQL injection
const ALLOWED_TABLES = [
  'customer',
  'order', 
  'product',
  'cart',
  'checkout',
  'orderItem'
] as const

type AllowedTable = typeof ALLOWED_TABLES[number]

export async function POST(req: NextRequest) {
  try {
    const { shop, table, confirm } = await req.json() as { 
      shop?: string
      table?: string 
      confirm?: boolean
    }
    
    if (!shop) {
      return NextResponse.json({ 
        ok: false, 
        error: 'missing shop parameter' 
      }, { status: 400 })
    }
    
    if (!table) {
      return NextResponse.json({ 
        ok: false, 
        error: 'missing table parameter',
        allowedTables: ALLOWED_TABLES
      }, { status: 400 })
    }
    
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ 
        ok: false, 
        error: `table '${table}' not allowed`,
        allowedTables: ALLOWED_TABLES
      }, { status: 400 })
    }
    
    if (!confirm) {
      return NextResponse.json({ 
        ok: false, 
        error: 'confirm parameter must be true to delete data',
        warning: `This will delete ALL ${table} data for shop ${shop}`
      }, { status: 400 })
    }

    const prisma = getPrisma()
    const tenantId = await resolveTenantIdFromShopDomain(shop)
    
    // Get count before deletion
    let beforeCount = 0
    let deleteResult: { count: number }
    
    switch (table as AllowedTable) {
      case 'customer':
        beforeCount = await prisma.customer.count({ where: { tenantId } })
        deleteResult = await prisma.customer.deleteMany({ where: { tenantId } })
        break
      case 'order':
        beforeCount = await prisma.order.count({ where: { tenantId } })
        deleteResult = await prisma.order.deleteMany({ where: { tenantId } })
        break
      case 'product':
        beforeCount = await prisma.product.count({ where: { tenantId } })
        deleteResult = await prisma.product.deleteMany({ where: { tenantId } })
        break
      case 'cart':
        beforeCount = await prisma.cart.count({ where: { tenantId } })
        deleteResult = await prisma.cart.deleteMany({ where: { tenantId } })
        break
      case 'checkout':
        beforeCount = await prisma.checkout.count({ where: { tenantId } })
        deleteResult = await prisma.checkout.deleteMany({ where: { tenantId } })
        break
      case 'orderItem':
        beforeCount = await prisma.orderItem.count({ where: { tenantId } })
        deleteResult = await prisma.orderItem.deleteMany({ where: { tenantId } })
        break
      default:
        return NextResponse.json({ 
          ok: false, 
          error: 'unhandled table type' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      ok: true, 
      table,
      shop,
      tenantId,
      beforeCount,
      deletedCount: deleteResult.count,
      timestamp: new Date().toISOString()
    })
    
  } catch (e: any) {
    console.error('Delete table data error:', e)
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? 'unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check table counts without deleting
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shop = searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({ 
        ok: false, 
        error: 'missing shop parameter' 
      }, { status: 400 })
    }

    const prisma = getPrisma()
    const tenantId = await resolveTenantIdFromShopDomain(shop)
    
    const counts = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.cart.count({ where: { tenantId } }),
      prisma.checkout.count({ where: { tenantId } }),
      prisma.orderItem.count({ where: { tenantId } })
    ])
    
    return NextResponse.json({ 
      ok: true,
      shop,
      tenantId,
      counts: {
        customer: counts[0],
        order: counts[1], 
        product: counts[2],
        cart: counts[3],
        checkout: counts[4],
        orderItem: counts[5]
      },
      allowedTables: ALLOWED_TABLES
    })
    
  } catch (e: any) {
    console.error('Get table counts error:', e)
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? 'unknown error' 
    }, { status: 500 })
  }
}