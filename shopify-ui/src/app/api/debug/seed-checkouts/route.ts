import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

// Map shops → Storefront tokens you put in Vercel env
function sfoTokenFor(shop: string) {
  if (shop === 'tenant-a-demo.myshopify.com') return process.env.STOREFRONT_TOKEN_TENANT_A!
  if (shop === 'tenant-b-demo.myshopify.com') return process.env.STOREFRONT_TOKEN_TENANT_B!
  throw new Error(`No storefront token configured for ${shop}`)
}

export async function POST(req: NextRequest) {
  const { shop, count = 5 } = (await req.json()) as { shop: string; count?: number }
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  const token = sfoTokenFor(shop)
  const endpoint = `https://${shop}/api/2024-10/graphql.json`

  // 1) Get a variant id that is actually available on the storefront
  const productQuery = `
    query {
      products(first: 1, query: "status:active") {
        edges {
          node {
            variants(first: 1) { edges { node { id } } }
          }
        }
      }
    }
  `
  const qRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: productQuery })
  })
  const qJson = await qRes.json()
  const variantId =
    qJson?.data?.products?.edges?.[0]?.node?.variants?.edges?.[0]?.node?.id
  if (!variantId) {
    return NextResponse.json({ error: 'No storefront-visible variant found. Make sure products are "Available on Online Store".', raw: qJson }, { status: 400 })
  }

  // 2) Create checkouts
  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { id webUrl }
        userErrors { field message }
      }
    }
  `
  const created: string[] = []
  const errors: string[] = []
  for (let i = 0; i < Number(count); i++) {
    const mRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({
        query: mutation,
        variables: { input: { lineItems: [{ variantId, quantity: 1 }] } }
      })
    })
    const mJson = await mRes.json()
    const url = mJson?.data?.checkoutCreate?.checkout?.webUrl
    const err = mJson?.data?.checkoutCreate?.userErrors?.map((e: any) => e.message)
    if (url) created.push(url)
    if (err?.length) errors.push(...err)
    // If GraphQL-level error:
    if (mJson?.errors) errors.push(...mJson.errors.map((e: any) => e.message))
  }

  return NextResponse.json({ ok: true, created, errors })
}