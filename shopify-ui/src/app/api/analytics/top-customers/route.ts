import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { resolveTenantIdFromShopDomain } from "@/lib/tenant";
import { adminFetch } from "@/lib/shopify-admin";

export const runtime = "nodejs";

const TOP_CUSTOMERS_QUERY = `
  query TopCustomers($ordersQuery: String!, $first: Int!) {
    orders(first: $first, query: $ordersQuery, sortKey: CREATED_AT, reverse: false) {
      edges {
        node {
          id
          createdAt
          totalPriceSet { shopMoney { amount } }
          customer {
            id
            firstName
            lastName
            email
            createdAt
          }
        }
      }
    }
  }
`;

type ShopifyTopCustomerNode = {
  id: string;
  createdAt: string;
  totalPriceSet?: { shopMoney?: { amount?: string | null } | null } | null;
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    createdAt?: string | null;
  } | null;
};

type ShopifyTopCustomersResponse = {
  orders: { edges: { node: ShopifyTopCustomerNode }[] };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const end = searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10);
    const start = searchParams.get("startDate") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const limit = Number(searchParams.get("limit") ?? 10);

    const prisma = getPrisma();
    const tenantId = await resolveTenantIdFromShopDomain(shop);
    const from = new Date(`${start}T00:00:00.000Z`);
    const to = new Date(`${end}T23:59:59.999Z`);

    const orders = await prisma.order.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      select: { customerShopifyId: true, totalPrice: true, createdAt: true },
    });

    const byCustomer = new Map<string, { orderCount: number; totalSpend: number; lastOrderAt: Date }>();
    const customerIds: bigint[] = [];

    orders.forEach((order:any) => {
      if (!order.customerShopifyId) return;
      const key = order.customerShopifyId.toString();
      if (!byCustomer.has(key)) {
        byCustomer.set(key, { orderCount: 0, totalSpend: 0, lastOrderAt: order.createdAt });
        customerIds.push(order.customerShopifyId);
      }
      const bucket = byCustomer.get(key)!;
      bucket.orderCount += 1;
      bucket.totalSpend += Number(order.totalPrice);
      if (order.createdAt > bucket.lastOrderAt) bucket.lastOrderAt = order.createdAt;
    });

    const customers = customerIds.length
      ? await prisma.customer.findMany({
          where: { tenantId, shopifyCustomerId: { in: customerIds } },
          select: { shopifyCustomerId: true, firstName: true, lastName: true, email: true, createdAt: true },
        })
      : [];

    const customerMap = new Map<string, typeof customers[number]>();
    customers.forEach((customer:any) => customerMap.set(customer.shopifyCustomerId.toString(), customer));

    const top = Array.from(byCustomer.entries())
      .map(([customerId, agg]) => {
        const customer = customerMap.get(customerId);
        const fullName = `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim() || `Customer ${customerId}`;
        const email = customer?.email ?? "—";
        const since = customer?.createdAt ? customer.createdAt.toISOString().split("T")[0] : "Unknown";
        const avg = agg.orderCount > 0 ? Math.round((agg.totalSpend / agg.orderCount) * 100) / 100 : 0;
        const daysSince = Math.floor((Date.now() - agg.lastOrderAt.getTime()) / 86_400_000);
        return {
          customerId,
          fullName,
          email,
          totalSpend: Math.round(agg.totalSpend * 100) / 100,
          orderCount: agg.orderCount,
          avgOrderValue: avg,
          customerSince: since,
          daysSinceLastOrder: daysSince,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend);

    if (top.length === 0) {
      return NextResponse.json(await fetchShopifyTopCustomers(shop, start, end, limit));
    }

    const summaryTotals = top.reduce(
      (acc, curr) => {
        acc.totalRevenue += curr.totalSpend;
        if (curr.totalSpend >= 25000) acc.vip += 1;
        else if (curr.totalSpend >= 5000) acc.regular += 1;
        else acc.casual += 1;
        return acc;
      },
      { totalRevenue: 0, vip: 0, regular: 0, casual: 0 }
    );

    const slice = top.slice(0, limit);

    return NextResponse.json({
      shop,
      window: { start, end },
      top: slice,
      summary: {
        totalCustomersWithOrders: top.length,
        totalUniqueCustomers: top.length,
        segments: {
          vip: summaryTotals.vip,
          regular: summaryTotals.regular,
          casual: summaryTotals.casual,
        },
        avgCustomerValue: top.length > 0 ? Math.round((summaryTotals.totalRevenue / top.length) * 100) / 100 : 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Top customers analytics error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchShopifyTopCustomers(shop: string, start: string, end: string, limit: number) {
  const ordersQuery = `created_at:>=${start} created_at:<=${end}`;
  const data = await adminFetch<ShopifyTopCustomersResponse>(shop, TOP_CUSTOMERS_QUERY, {
    ordersQuery,
    first: 250,
  });
  const orders = data.orders.edges.map((edge) => edge.node).filter((order) => order.customer);
  const customerAgg = new Map<string, {
    customerId: string;
    fullName: string;
    email: string;
    totalSpend: number;
    orderCount: number;
    avgOrderValue: number;
    customerSince: string;
    daysSinceLastOrder: number;
  }>();

  for (const order of orders) {
    if (!order.customer) continue;
    const customerId = order.customer.id;
    const orderValue = parseFloat(order.totalPriceSet?.shopMoney?.amount || "0");
    const orderDate = new Date(order.createdAt);
    const existing = customerAgg.get(customerId) ?? {
      customerId,
      fullName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Unknown Customer",
      email: order.customer.email || "No email",
      totalSpend: 0,
      orderCount: 0,
      avgOrderValue: 0,
      customerSince: order.customer.createdAt ? new Date(order.customer.createdAt).toISOString().split("T")[0] : "Unknown",
      daysSinceLastOrder: 0,
    };

    existing.totalSpend += orderValue;
    existing.orderCount += 1;
    existing.daysSinceLastOrder = Math.floor((Date.now() - orderDate.getTime()) / 86_400_000);
    customerAgg.set(customerId, existing);
  }

  const allCustomersData = Array.from(customerAgg.values()).map((customer) => ({
    ...customer,
    avgOrderValue: Math.round((customer.totalSpend / customer.orderCount) * 100) / 100,
    totalSpend: Math.round(customer.totalSpend * 100) / 100,
  }));

  const topCustomers = allCustomersData.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, limit);
  const totalRevenue = allCustomersData.reduce((sum, c) => sum + c.totalSpend, 0);

  return {
    shop,
    window: { start, end },
    top: topCustomers,
    summary: {
      totalCustomersWithOrders: allCustomersData.length,
      totalUniqueCustomers: allCustomersData.length,
      segments: {
        vip: allCustomersData.filter((c) => c.totalSpend >= 25000).length,
        regular: allCustomersData.filter((c) => c.totalSpend >= 5000 && c.totalSpend < 25000).length,
        casual: allCustomersData.filter((c) => c.totalSpend < 5000).length,
      },
      avgCustomerValue: allCustomersData.length > 0 ? Math.round((totalRevenue / allCustomersData.length) * 100) / 100 : 0,
    },
  };
}
