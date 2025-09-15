// Small helper to call Admin GraphQL using the accessToken stored in your DB.
import { getPrisma } from '@/lib/db'

export async function adminFetch(shop: string, query: string, variables?: any) {
  const prisma = getPrisma()
  const store = await prisma.store.findFirst({ where: { shopDomain: shop } })
  if (!store?.accessToken) throw new Error("Missing access token for store")

  const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": store.accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })
  const json = await res.json()
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? json))
  }
  return json.data
}
