// app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'

export const runtime = 'node' // ensure Node runtime, not edge

export async function GET(req: NextRequest) {
  const env = getEnv()
  const prisma = getPrisma()

  try {
    const { searchParams } = new URL(req.url)
    const shop = searchParams.get('shop')
    const code = searchParams.get('code')

    if (!shop || !code) {
      return NextResponse.json({ error: 'Missing shop or code' }, { status: 400 })
    }
    if (!shop.endsWith('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
    }

    // 1) Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.SHOPIFY_API_KEY,
        client_secret: env.SHOPIFY_API_SECRET,
        code
      })
    })

    if (!tokenRes.ok) {
      const detail = await tokenRes.text().catch(() => '')
      console.error('Token exchange failed:', tokenRes.status, detail)
      return NextResponse.json({ error: 'Token exchange failed', detail }, { status: 400 })
    }

    const tokenJson = (await tokenRes.json()) as { access_token: string }
    const accessToken = tokenJson.access_token

    // 2) Resolve or create tenant id (must be 16-byte Buffer for BINARY(16))
    const tenantId = await resolveTenantIdFromShopDomain(shop) // expect Buffer(16)

    // 3) Ensure Tenant exists (primary key is `id`)
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {}, // no updatedAt if not in schema
      create: { id: tenantId, name: shop }
    })

    // 4) Upsert Store for this shop and tenant
    // If you defined @@unique([shopDomain]) on Store, you can use store.upsert with where: { shopDomain: shop }.
    // To be safe regardless of schema, do findFirst → create/update:
    const existing = await prisma.store.findFirst({ where: { shopDomain: shop } })
    if (existing) {
      await prisma.store.update({
        where: { id: existing.id },
        data: { accessToken, tenantId } // keep tenantId in sync
      })
    } else {
      await prisma.store.create({
        data: { tenantId, shopDomain: shop, accessToken }
      })
    }

    // 5) Register minimal webhooks (best-effort; log failures)
    const topics = [
      'orders/create', 'orders/updated',
      'customers/create', 'customers/updated',
      'products/create', 'products/updated'
    ]
    const baseWebhookUrl = `${env.SHOPIFY_APP_URL}/api/webhooks`

    await Promise.all(
      topics.map(async (topic) => {
        try {
          const resp = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              webhook: { topic, format: 'json', address: `${baseWebhookUrl}/${topic}` }
            })
          })
          if (!resp.ok) {
            console.error('Failed to register webhook', topic, await resp.text())
          }
        } catch (err) {
          console.error('Webhook registration error', topic, err)
        }
      })
    )

    // Success — you can redirect to your app UI if you prefer:
    // return NextResponse.redirect(`${env.SHOPIFY_APP_URL}/dashboard`)
// app/api/oauth/callback/route.ts (or src/app/api/... based on your tree)

  // Success — redirect to dashboard so install flow feels right
return NextResponse.redirect(`${env.SHOPIFY_APP_URL}/dashboard`)

  } catch (err: any) {
    console.error('OAuth callback exception:', err)
    return NextResponse.json({ error: 'OAuth callback exception', detail: String(err?.message ?? err) }, { status: 500 })
  }
}
