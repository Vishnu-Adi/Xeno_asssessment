// app/api/debug/stores/route.ts
import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
export async function GET() {
  const stores = await getPrisma().store.findMany({ select: { id: true, shopDomain: true, tenantId: true } })
  return NextResponse.json(stores)
}
