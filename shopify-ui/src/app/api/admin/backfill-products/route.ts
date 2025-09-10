// src/app/api/admin/backfill-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { shop } = await req.json() as { shop: string }
  if (!shop) return NextResponse.json({ error: 'missing shop' }, { status: 400 })

  const prisma = getPrisma()
  const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
  if (!store) return NextResponse.json({ error: 'store not installed' }, { status: 404 })
  const tenantId = (await prisma.store.findFirst({ where: { shopDomain: shop }, select: { tenantId: true } }))!.tenantId

  const headers = { 'X-Shopify-Access-Token': store.accessToken as string }
  let url = `https://${shop}/admin/api/2024-10/products.json?limit=250`
  let upserts = 0

  while (url) {
    const r = await fetch(url, { headers })
    if (!r.ok) return NextResponse.json({ error: 'admin api error', status: r.status, text: await r.text() }, { status: 502 })
    const json = await r.json() as any
    const products = json.products ?? []

    for (const p of products) {
      await prisma.product.upsert({
        where: { tenantId_shopifyProductId: { tenantId, shopifyProductId: BigInt(p.id) } },
        update: { title: p.title },
        create: { tenantId, shopifyProductId: BigInt(p.id), title: p.title }
      })
      upserts++
    }

    // handle pagination via Link header
    const link = r.headers.get('link')
    const next = link?.split(',').find(s => s.includes('rel="next"'))
    url = next ? next.slice(next.indexOf('<')+1, next.indexOf('>')) : ''
  }

  return NextResponse.json({ ok: true, upserts })
}
