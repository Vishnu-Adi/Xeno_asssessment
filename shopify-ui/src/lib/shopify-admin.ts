// Small helper to call Admin GraphQL using the accessToken stored in your DB.
import { getPrisma } from '@/lib/db'

const tokenCache = new Map<string, string>()

function envTokenForShop(shop: string): string | undefined {
  const base = shop.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const byShop = process.env[`SHOPIFY_TOKEN_${base}`]
  return byShop || process.env.SHOPIFY_ACCESS_TOKEN
}

export async function adminFetch<T = unknown>(
  shop: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  let token = tokenCache.get(shop)

  if (!token) {
    try {
      const prisma = getPrisma()
      const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
      token = store?.accessToken ?? undefined
    } catch (_e) {
      token = undefined
    }
  }

  if (!token) {
    token = envTokenForShop(shop)
  }
  if (!token) throw new Error(`Missing access token for store ${shop}. Provide in DB or env (SHOPIFY_TOKEN_${shop.toUpperCase().replace(/[^A-Z0-9]/g, '_')} or SHOPIFY_ACCESS_TOKEN).`)

  tokenCache.set(shop, token)

  const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })
  const json = (await res.json()) as { data: T; errors?: unknown }
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? json))
  }
  return json.data
}
