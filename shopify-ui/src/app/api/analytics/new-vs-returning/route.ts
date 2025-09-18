import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { resolveTenantIdFromShopDomain } from "@/lib/tenant";
import { adminFetch } from "@/lib/shopify-admin";

export const runtime = "nodejs";

const ORDERS_QUERY = `
  query NVR($ordersQuery: String!, $first: Int!) {
    orders(first: $first, query: $ordersQuery, sortKey: CREATED_AT, reverse: false) {
      edges {
        node {
          id
          createdAt
          totalPriceSet { shopMoney { amount } }
          customer { id createdAt }
        }
      }
    }
  }
`;

type ShopifyNvrCustomer = {
  id: string;
  createdAt: string;
};

type ShopifyNvrOrder = {
  id: string;
  createdAt: string;
  totalPriceSet?: { shopMoney?: { amount?: string | null } | null } | null;
  customer?: ShopifyNvrCustomer | null;
};

type ShopifyNvrResponse = {
  orders: { edges: { node: ShopifyNvrOrder }[] };
};

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
      select: { customerShopifyId: true, totalPrice: true },
    });

    const customerIds = Array.from(
      new Set(orders.map((order: any) => order.customerShopifyId).filter((id: any): id is bigint => id !== null))
    );

    const firstOrders = customerIds.length
      ? await prisma.order.groupBy({
          by: ["customerShopifyId"],
          where: { tenantId, customerShopifyId: { in: customerIds } },
          _min: { createdAt: true },
        })
      : [];

    const firstOrderMap = new Map<string, Date>();
    firstOrders.forEach((row: any) => {
      if (row.customerShopifyId && row._min.createdAt) {
        firstOrderMap.set(row.customerShopifyId.toString(), row._min.createdAt);
      }
    });

    let newCount = 0;
    let returningCount = 0;
    let newRevenue = 0;
    let returningRevenue = 0;

    orders.forEach((order: any) => {
      const amount = Number(order.totalPrice);
      if (!order.customerShopifyId) {
        newCount += 1;
        newRevenue += amount;
        return;
      }
      const key = order.customerShopifyId.toString();
      const firstOrderDate = firstOrderMap.get(key);
      if (firstOrderDate && firstOrderDate >= from && firstOrderDate <= to) {
        newCount += 1;
        newRevenue += amount;
      } else {
        returningCount += 1;
        returningRevenue += amount;
      }
    });

    const totalRaw = newCount + returningCount;
    if (totalRaw === 0) {
      return NextResponse.json(await fetchShopifyBreakdown(shop, start, end));
    }
    const total = totalRaw || 1;

    return NextResponse.json({
      shop,
      window: { start, end },
      breakdown: {
        new: {
          count: newCount,
          revenue: Math.round(newRevenue * 100) / 100,
          pct: Math.round((newCount / total) * 100),
        },
        returning: {
          count: returningCount,
          revenue: Math.round(returningRevenue * 100) / 100,
          pct: Math.round((returningCount / total) * 100),
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("New vs returning analytics error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchShopifyBreakdown(shop: string, start: string, end: string) {
  const ordersQuery = `created_at:>=${start} created_at:<=${end}`;
  const data = await adminFetch<ShopifyNvrResponse>(shop, ORDERS_QUERY, { ordersQuery, first: 250 });
  const orders = (data.orders.edges || [])
    .map((edge) => edge.node)
    .filter((order) => order.customer);

  let newCount = 0;
  let returningCount = 0;
  let newRevenue = 0;
  let returningRevenue = 0;

  for (const o of orders) {
    const customer = o.customer!;
    const firstSeen = new Date(customer.createdAt);
    const withinWindowFirstOrder = firstSeen >= new Date(start) && firstSeen <= new Date(end);
    const amt = parseFloat(o.totalPriceSet?.shopMoney?.amount || "0");
    if (withinWindowFirstOrder) {
      newCount += 1;
      newRevenue += amt;
    } else {
      returningCount += 1;
      returningRevenue += amt;
    }
  }

  const total = newCount + returningCount || 1;

  return {
    shop,
    window: { start, end },
    breakdown: {
      new: { count: newCount, revenue: Math.round(newRevenue * 100) / 100, pct: Math.round((newCount / total) * 100) },
      returning: { count: returningCount, revenue: Math.round(returningRevenue * 100) / 100, pct: Math.round((returningCount / total) * 100) },
    },
  };
}
