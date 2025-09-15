import { NextRequest, NextResponse } from "next/server";
import { adminFetch } from "@/lib/shopify-admin";

export const runtime = "nodejs";

const ORDERS_LIST_Q = `
  query OrdersList($ordersQuery: String!, $first: Int!, $after: String, $reverse: Boolean) {
    orders(first: $first, after: $after, query: $ordersQuery, sortKey: CREATED_AT, reverse: $reverse) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet { shopMoney { amount currencyCode } }
          displayFulfillmentStatus
          paymentGatewayNames
          customer { displayName email }
        }
      }
    }
  }
`;

function quote(s: string) {
  // Wrap in quotes if contains special chars or @ to ensure Shopify query parsing
  if (/[@\s:#]/.test(s)) return `"${s}"`;
  return s;
}

function buildQuery(start: string, end: string, search?: string | null, status?: string | null) {
  const parts: string[] = [];
  parts.push(`created_at:>=${start}`);
  parts.push(`created_at:<=${end}`);
  if (search && search.trim()) {
    const s = search.trim();
    console.log('Building search query for:', s);
    
    if (s.includes('@')) {
      // Email search
      parts.push(`email:"${s}"`);
    } else if (s.startsWith('#')) {
      // Order name search with hash
      parts.push(`name:"${s}"`);
    } else if (/^\d+$/.test(s)) {
      // Numeric order number - try both with and without hash
      parts.push(`(name:"#${s}" OR name:"${s}")`);
    } else {
      // General text search - try in both email and name
      parts.push(`(email:"${s}" OR name:"${s}" OR name:"#${s}")`);
    }
  }
  if (status && status !== 'all') {
    const statusMap: Record<string,string> = { 
      fulfilled: 'fulfilled', 
      unfulfilled: 'unfulfilled', 
      partial: 'partial' 
    };
    const mappedStatus = statusMap[status] || status;
    console.log('Adding status filter:', status, '->', mappedStatus);
    parts.push(`fulfillment_status:${mappedStatus}`);
  }
  const query = parts.join(' AND ');
  console.log('Final Shopify query:', query);
  return query;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) return NextResponse.json({ error: 'Missing shop' }, { status: 400 });

    const start = searchParams.get('startDate') ?? new Date(Date.now()-7*86400000).toISOString().slice(0,10);
    const end = searchParams.get('endDate') ?? new Date().toISOString().slice(0,10);
    const search = searchParams.get('q');
    const status = searchParams.get('status'); // all|fulfilled|unfulfilled|partial
    const after = searchParams.get('after');
    const sort = (searchParams.get('sort') ?? 'desc') === 'asc' ? false : true; // reverse=true -> desc
    const pageSize = Math.min(25, Math.max(5, Number(searchParams.get('limit') ?? 10)));

    const ordersQuery = buildQuery(start, end, search, status);
    const vars: any = { ordersQuery, first: pageSize, reverse: sort };
    if (after && after !== 'undefined' && after !== 'null' && after.trim() !== '') {
      vars.after = after;
    }
    const data = await adminFetch(shop, ORDERS_LIST_Q, vars);

    const edges = data.orders.edges || [];
    const items = edges.map((e: any) => e.node).map((o: any) => ({
      id: o.id,
      name: o.name,
      createdAt: o.createdAt,
      total: parseFloat(o.totalPriceSet?.shopMoney?.amount || '0'),
      currency: o.totalPriceSet?.shopMoney?.currencyCode || 'INR',
      fulfillment: o.displayFulfillmentStatus || 'UNFULFILLED',
      gateways: o.paymentGatewayNames || [],
      customer: { name: o.customer?.displayName || 'Guest', email: o.customer?.email || '' },
    }));

    return NextResponse.json({
      shop,
      window: { start, end },
      pageInfo: data.orders.pageInfo,
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
