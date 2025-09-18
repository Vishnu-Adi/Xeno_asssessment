import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { resolveTenantIdFromShopDomain } from "@/lib/tenant";
import { adminFetch } from "@/lib/shopify-admin";

export const runtime = "nodejs";

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(s.length/2);
  return s.length % 2 ? s[mid] : (s[mid-1]+s[mid])/2;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const end = searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10);
    const start = searchParams.get("startDate") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const prisma = getPrisma();
    const tenantId = await resolveTenantIdFromShopDomain(shop);
    const from = new Date(`${start}T00:00:00.000Z`);
    const to = new Date(`${end}T23:59:59.999Z`);

    const orders = await prisma.order.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      select: { status: true, createdAt: true, updatedAt: true },
    });

    const counts: Record<string, number> = {};
    const slas: number[] = [];

    orders.forEach((order: { status: string; createdAt: Date; updatedAt: Date }) => {
      const statusKey = order.status.toUpperCase();
      counts[statusKey] = (counts[statusKey] || 0) + 1;
      if (order.status === "fulfilled") {
        const diff = (order.updatedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60);
        if (diff >= 0) slas.push(diff);
      }
    });

    const totalRaw = orders.length;
    if (totalRaw === 0 || Object.values(counts).reduce((sum, val) => sum + val, 0) === 0) {
      return NextResponse.json(await fetchShopifySla(shop, start, end));
    }
    const total = totalRaw || 1;

    return NextResponse.json({
      shop,
      window: { start, end },
      statusSplit: Object.entries(counts).map(([k, v]) => ({ status: k, count: v, pct: Math.round((v / total) * 100) })),
      medianSlaHours: Math.round(median(slas) * 10) / 10,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const FULFILL_QUERY = `
  query FULFILL($ordersQuery: String!, $first: Int!) {
    orders(first: $first, query: $ordersQuery, sortKey: CREATED_AT, reverse: false) {
      edges {
        node {
          id
          createdAt
          displayFulfillmentStatus
          fulfillments { createdAt }
        }
      }
    }
  }
`;

type ShopifyFulfillmentOrder = {
  id: string;
  createdAt: string;
  displayFulfillmentStatus?: string | null;
  fulfillments?: { createdAt?: string | null }[] | null;
};

type ShopifyFulfillmentResponse = {
  orders: { edges: { node: ShopifyFulfillmentOrder }[] };
};

async function fetchShopifySla(shop: string, start: string, end: string) {
  const ordersQuery = `created_at:>=${start} created_at:<=${end}`;
  const data = await adminFetch<ShopifyFulfillmentResponse>(shop, FULFILL_QUERY, {
    ordersQuery,
    first: 250,
  });
  const orders = (data.orders.edges || []).map((edge) => edge.node);

  const counts: Record<string, number> = {};
  const slas: number[] = [];
  for (const o of orders) {
    const status = o.displayFulfillmentStatus ?? "UNFULFILLED";
    counts[status] = (counts[status] || 0) + 1;
    const f = o.fulfillments?.[0]?.createdAt;
    if (f) {
      const hours = (new Date(f).getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
      if (hours >= 0) slas.push(hours);
    }
  }

  const total = orders.length || 1;
  return {
    shop,
    window: { start, end },
    statusSplit: Object.entries(counts).map(([k, v]) => ({ status: k, count: v, pct: Math.round((v / total) * 100) })),
    medianSlaHours: Math.round(median(slas) * 10) / 10,
  };
}
