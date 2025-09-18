import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
import { adminFetch } from '@/lib/shopify-admin'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const shop = url.searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  try {
    const prisma = getPrisma()
    const tenantId = await resolveTenantIdFromShopDomain(shop)
    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { shopifyProductId: true, title: true, updatedAt: true, status: true }
    })

    if (products.length === 0) {
      return NextResponse.json(await fetchShopifyProducts(shop))
    }

    const items = products.map((product) => ({
      id: product.shopifyProductId ? `gid://shopify/Product/${product.shopifyProductId.toString()}` : undefined,
      title: product.title,
      updatedAt: product.updatedAt.toISOString(),
      status: product.status ?? 'ACTIVE'
    }))
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const RECENT_PRODUCTS_QUERY = `
  query RecentProducts($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          updatedAt
          status
        }
      }
    }
  }
`

async function fetchShopifyProducts(shop: string) {
  type ShopifyProductNode = {
    id: string
    title: string
    updatedAt: string
    status?: string | null
  }

  type ShopifyProductsResponse = {
    products: { edges: { node: ShopifyProductNode }[] }
  }

  const data = await adminFetch<ShopifyProductsResponse>(shop, RECENT_PRODUCTS_QUERY, { first: 10 })
  const items = (data.products.edges || []).map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    updatedAt: edge.node.updatedAt,
    status: edge.node.status || 'ACTIVE'
  }))
  return { items }
}
