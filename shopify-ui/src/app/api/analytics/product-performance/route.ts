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
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  try {
    // Get product performance metrics
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        shopifyProductId: true,
        title: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    // Calculate performance metrics for each product
    const productMetrics = await Promise.all(
      products.map(async (product) => {
        // Since we don't have direct product-order relationships in our current schema,
        // we'll calculate based on product activity and creation timing
        const daysSinceCreated = Math.ceil((now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        const daysSinceUpdated = Math.ceil((now.getTime() - product.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        
        // Mock performance data based on product characteristics
        // In a real app, this would come from order line items or product analytics
        const mockMetrics = {
          views: Math.floor(Math.random() * 1000) + (daysSinceCreated < 7 ? 500 : 100),
          cartAdds: Math.floor(Math.random() * 50) + (daysSinceUpdated < 3 ? 20 : 5),
          purchases: Math.floor(Math.random() * 20) + (daysSinceCreated < 30 ? 10 : 2),
          revenue: (Math.random() * 5000) + 100
        }

        return {
          id: product.id.toString(),
          shopifyProductId: product.shopifyProductId.toString(),
          title: product.title,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          metrics: {
            views: mockMetrics.views,
            cartAdds: mockMetrics.cartAdds,
            purchases: mockMetrics.purchases,
            revenue: mockMetrics.revenue,
            conversionRate: mockMetrics.views > 0 ? (mockMetrics.purchases / mockMetrics.views) * 100 : 0,
            cartConversionRate: mockMetrics.cartAdds > 0 ? (mockMetrics.purchases / mockMetrics.cartAdds) * 100 : 0,
            avgOrderValue: mockMetrics.purchases > 0 ? mockMetrics.revenue / mockMetrics.purchases : 0
          },
          performance: {
            daysSinceCreated,
            daysSinceUpdated,
            isNewProduct: daysSinceCreated <= 7,
            isRecentlyUpdated: daysSinceUpdated <= 3,
            performanceScore: Math.min(100, 
              (mockMetrics.purchases * 10) + 
              (mockMetrics.cartAdds * 2) + 
              (mockMetrics.views * 0.1)
            )
          }
        }
      })
    )

    // Sort by performance score
    const sortedProducts = productMetrics.sort((a, b) => b.performance.performanceScore - a.performance.performanceScore)
    
    // Calculate category insights
    const insights = {
      totalProducts: products.length,
      newProducts: productMetrics.filter(p => p.performance.isNewProduct).length,
      recentlyUpdated: productMetrics.filter(p => p.performance.isRecentlyUpdated).length,
      avgConversionRate: productMetrics.length > 0 
        ? productMetrics.reduce((sum, p) => sum + p.metrics.conversionRate, 0) / productMetrics.length 
        : 0,
      totalRevenue: productMetrics.reduce((sum, p) => sum + p.metrics.revenue, 0),
      topPerformingProduct: sortedProducts[0] || null
    }

    // Get trending products (recently updated with high performance)
    const trendingProducts = productMetrics
      .filter(p => p.performance.isRecentlyUpdated)
      .sort((a, b) => b.performance.performanceScore - a.performance.performanceScore)
      .slice(0, 5)

    return NextResponse.json(safeJson({
      products: sortedProducts,
      trending: trendingProducts,
      insights
    }))
  } catch (error) {
    console.error('Product performance query failed:', error)
    return NextResponse.json({
      products: [],
      trending: [],
      insights: {
        totalProducts: 0,
        newProducts: 0,
        recentlyUpdated: 0,
        avgConversionRate: 0,
        totalRevenue: 0,
        topPerformingProduct: null
      }
    })
  }
}

