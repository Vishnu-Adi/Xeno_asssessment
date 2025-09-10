import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
export const runtime = 'nodejs'

// map shops to storefront tokens from env
function storefrontTokenFor(shop: string) {
  if (shop === 'tenant-a-demo.myshopify.com') return process.env.STOREFRONT_TOKEN_TENANT_A!
  if (shop === 'tenant-b-demo.myshopify.com') return process.env.STOREFRONT_TOKEN_TENANT_B!
  throw new Error(`No storefront token configured for ${shop}`)
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma()
  const { shop, count = 3 } = await req.json() as { shop: string; count?: number }
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  // 1) Grab any variant id via Admin (we already store the Admin token)
  const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
  if (!store) return NextResponse.json({ error: 'store not installed' }, { status: 400 })

  const prodRes = await fetch(`https://${shop}/admin/api/2024-10/products.json?limit=1`, {
    headers: { 'X-Shopify-Access-Token': store.accessToken }
  })
  if (!prodRes.ok) return NextResponse.json({ error: 'no products available' }, { status: 400 })
  const prodJson = await prodRes.json() as any
  const variantIdNum = prodJson.products?.[0]?.variants?.[0]?.id
  if (!variantIdNum) return NextResponse.json({ error: 'no variant found' }, { status: 400 })

  const storefrontToken = storefrontTokenFor(shop)
  const gqlEndpoint = `https://${shop}/api/2024-10/graphql.json`
  const variantGid = `gid://shopify/ProductVariant/${variantIdNum}`

  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { id webUrl }
        userErrors { field message }
      }
    }
  `

  const created: string[] = []
  for (let i = 0; i < Number(count); i++) {
    const body = JSON.stringify({
      query: mutation,
      variables: { input: { lineItems: [{ variantId: variantGid, quantity: 1 }] } }
    })
    const r = await fetch(gqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken
      },
      body
    })
    const j = await r.json()
    const url = j?.data?.checkoutCreate?.checkout?.webUrl
    const err = j?.data?.checkoutCreate?.userErrors?.[0]?.message
    if (url) created.push(url)
    else console.error('checkoutCreate error', err ?? j)
  }

  // This fires your checkouts/create webhook for each checkout.
  return NextResponse.json({ ok: true, created })
}
