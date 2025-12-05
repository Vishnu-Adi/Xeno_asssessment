import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'
import * as CustomersRepo from '@/repos/customers'

export const runtime = 'nodejs'

function envTokenForShop(shop: string): string | undefined {
  const base = shop.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  return process.env[`SHOPIFY_TOKEN_${base}`] || process.env.SHOPIFY_ACCESS_TOKEN
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma()
  const { shop, accessToken: bodyToken, first = 50, force = false } = (await req.json()) as { shop?: string; accessToken?: string; first?: number; force?: boolean }
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  // Try to get access token: body > DB > env
  let accessToken = bodyToken as string | undefined
  if (!accessToken) {
    const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
    accessToken = store?.accessToken
  }
  if (!accessToken) {
    accessToken = envTokenForShop(shop)
  }
  if (!accessToken) return NextResponse.json({ error: 'store not installed and no accessToken provided' }, { status: 404 })

  const tenantId = await resolveTenantIdFromShopDomain(shop)
  
  // Check if table is empty, skip if already has data (unless force=true)
  if (!force) {
    const existingCount = await prisma.customer.count({ where: { tenantId } })
    if (existingCount > 0) {
      return NextResponse.json({ 
        ok: true, 
        upserts: 0, 
        skipped: true, 
        message: `Found ${existingCount} existing customers. Use force:true to override.` 
      })
    }
  }
  
  const endpoint = `https://${shop}/admin/api/2024-10/graphql.json`

  let hasNextPage = true
  let cursor: string | null = null
  let upserts = 0

  while (hasNextPage) {
    const query = `
      query Customers($first: Int!, $after: String) {
        customers(first: $first, after: $after, sortKey: CREATED_AT) {
          edges { 
            node { 
              id 
              legacyResourceId
              email 
              firstName 
              lastName 
              createdAt 
            } 
            cursor 
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `
    const res: Response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken! },
      body: JSON.stringify({ query, variables: { first: Math.min(100, Number(first)), after: cursor } })
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`GraphQL error ${res.status}:`, errorText)
      return NextResponse.json({ error: 'admin_graphql_error', status: res.status, text: errorText }, { status: 502 })
    }
    
    const json = await res.json()
    console.log(`Fetched ${json?.data?.customers?.edges?.length || 0} customers, hasNextPage: ${json?.data?.customers?.pageInfo?.hasNextPage}`)
    
    if (json.errors) {
      console.error('GraphQL errors:', json.errors)
      return NextResponse.json({ error: 'graphql_errors', errors: json.errors }, { status: 400 })
    }
    
    const edges = json?.data?.customers?.edges ?? []
    for (const edge of edges) {
      try {
        const c = edge.node
        const id = c.legacyResourceId || String(c.id).split('/').pop()!
        
        console.log(`Upserting customer ${id} for tenant ${tenantId}`)
        await CustomersRepo.upsertFromShopify({ tenantId }, {
          id,
          email: c.email ?? undefined,
          first_name: c.firstName ?? undefined,
          last_name: c.lastName ?? undefined,
          created_at: c.createdAt ?? undefined,
        })
        upserts++
      } catch (error) {
        console.error('Error upserting customer:', error)
      }
    }
    hasNextPage = Boolean(json?.data?.customers?.pageInfo?.hasNextPage)
    cursor = json?.data?.customers?.pageInfo?.endCursor ?? null
  }

  return NextResponse.json({ ok: true, upserts })
}


