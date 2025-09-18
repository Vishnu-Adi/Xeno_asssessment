// src/app/api/admin/backfill-products/route.ts
// MIGRATED TO NEW GRAPHQL PRODUCT APIS (2024-04+) - Compliant with Feb 1st, 2025 deadline
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { shop, force = false } = await req.json() as { shop: string; force?: boolean }
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  const prisma = getPrisma()
  const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
  if (!store) return NextResponse.json({ error: 'store not installed' }, { status: 404 })
  const tenantId = (await prisma.store.findFirst({ where: { shopDomain: shop }, select: { tenantId: true } }))!.tenantId

  // Check if table is empty, skip if already has data (unless force=true)
  if (!force) {
    const existingCount = await prisma.product.count({ where: { tenantId } })
    if (existingCount > 0) {
      return NextResponse.json({ 
        ok: true, 
        upserts: 0, 
        skipped: true, 
        message: `Found ${existingCount} existing products. Use force:true to override.` 
      })
    }
  }

  const headers = { 
    'X-Shopify-Access-Token': store.accessToken as string,
    'Content-Type': 'application/json'
  }
  
  let upserts = 0
  let hasNextPage = true
  let cursor: string | null = null

  // Use new GraphQL Product APIs instead of deprecated REST
  while (hasNextPage) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              legacyResourceId
              title
              handle
              status
              createdAt
              updatedAt
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `

    const variables: { first: number; after?: string } = {
      first: 50, // Reduced batch size for GraphQL
      ...(cursor && { after: cursor })
    }

    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GraphQL error ${response.status}:`, errorText)
      return NextResponse.json({ 
        error: 'GraphQL API error', 
        status: response.status, 
        text: errorText 
      }, { status: 502 })
    }

    const result = await response.json()
    console.log(`Fetched ${result.data?.products?.edges?.length || 0} products, hasNextPage: ${result.data?.products?.pageInfo?.hasNextPage}`)
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      return NextResponse.json({ 
        error: 'GraphQL query errors', 
        errors: result.errors 
      }, { status: 400 })
    }

    const products = result.data?.products?.edges ?? []

    for (const edge of products) {
      try {
        const product = edge.node
        // Extract numeric ID from GraphQL global ID (gid://shopify/Product/123 -> 123)
        const numericId = product.legacyResourceId || product.id.split('/').pop()
        
        console.log(`Upserting product ${numericId} for tenant ${tenantId}`)
        await prisma.product.upsert({
          where: { tenantId_shopifyProductId: { tenantId, shopifyProductId: BigInt(numericId) } },
          update: { 
            title: product.title,
            handle: product.handle,
            status: product.status,
            updatedAt: new Date(product.updatedAt)
          },
          create: { 
            tenantId, 
            shopifyProductId: BigInt(numericId), 
            title: product.title,
            handle: product.handle,
            status: product.status,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          }
        })
        upserts++
      } catch (error) {
        console.error('Error upserting product:', error)
      }
    }

    // Handle GraphQL pagination
    const pageInfo = result.data?.products?.pageInfo
    hasNextPage = pageInfo?.hasNextPage ?? false
    cursor = pageInfo?.endCursor ?? null
  }

  return NextResponse.json({ 
    ok: true, 
    upserts,
    apiVersion: '2024-10-graphql',
    migrationCompliant: true 
  })
}
