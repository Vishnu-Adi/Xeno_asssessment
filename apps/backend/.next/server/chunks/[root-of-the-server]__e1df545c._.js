module.exports = [
"[project]/Documents/xeno/shopify-mt/apps/backend/.next-internal/server/app/api/analytics/top-customers/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEnv",
    ()=>getEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/node_modules/.pnpm/zod@4.1.5/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
;
const envSchema = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'test',
        'production'
    ]).default('development'),
    DATABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url(),
    SHOPIFY_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    SHOPIFY_API_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    SHOPIFY_SCOPES: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    SHOPIFY_APP_URL: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url(),
    SHOPIFY_REDIRECT_PATH: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default('/api/oauth/callback'),
    // Email configuration (optional for development)
    EMAIL_SERVER_HOST: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EMAIL_SERVER_PORT: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EMAIL_SERVER_USER: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EMAIL_SERVER_PASSWORD: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EMAIL_FROM: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXTAUTH_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXTAUTH_URL: __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$5$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()
});
let cachedEnv = null;
function getEnv() {
    if (cachedEnv) return cachedEnv;
    const parsed = envSchema.safeParse({
        NODE_ENV: ("TURBOPACK compile-time value", "development"),
        DATABASE_URL: process.env.DATABASE_URL,
        SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
        SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
        SHOPIFY_REDIRECT_PATH: process.env.SHOPIFY_REDIRECT_PATH,
        EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
        EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
        EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
        EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
        EMAIL_FROM: process.env.EMAIL_FROM,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
    });
    if (!parsed.success) {
        console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables');
    }
    cachedEnv = parsed.data;
    return cachedEnv;
}
}),
"[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPrisma",
    ()=>getPrisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/env.ts [app-route] (ecmascript)");
;
;
function getPrisma() {
    // Ensure env parsed (side-effect to validate early)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEnv"])();
    if (global.prisma) return global.prisma;
    const client = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
        log: ("TURBOPACK compile-time truthy", 1) ? [
            'query',
            'error',
            'warn'
        ] : "TURBOPACK unreachable"
    });
    global.prisma = client;
    return client;
}
}),
"[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/shopify-admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Small helper to call Admin GraphQL using the accessToken stored in your DB.
__turbopack_context__.s([
    "adminFetch",
    ()=>adminFetch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/db.ts [app-route] (ecmascript)");
;
function envTokenForShop(shop) {
    const base = shop.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const byShop = process.env[`SHOPIFY_TOKEN_${base}`];
    return byShop || process.env.SHOPIFY_ACCESS_TOKEN;
}
async function adminFetch(shop, query, variables) {
    let token;
    // Try DB first, but tolerate DB outages and fall back to env
    try {
        const prisma = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPrisma"])();
        const store = await prisma.store.findFirst({
            where: {
                shopDomain: shop
            }
        });
        token = store?.accessToken;
    } catch (_e) {
    // ignore and try env
    }
    if (!token) token = envTokenForShop(shop);
    if (!token) throw new Error(`Missing access token for store ${shop}. Provide in DB or env (SHOPIFY_TOKEN_${shop.toUpperCase().replace(/[^A-Z0-9]/g, '_')} or SHOPIFY_ACCESS_TOKEN).`);
    const res = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token
        },
        body: JSON.stringify({
            query,
            variables
        }),
        cache: "no-store"
    });
    const json = await res.json();
    if (!res.ok || json.errors) {
        throw new Error(JSON.stringify(json.errors ?? json));
    }
    return json.data;
}
}),
"[project]/Documents/xeno/shopify-mt/apps/backend/src/app/api/analytics/top-customers/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/app/api/analytics/top-customers/route.ts - Real Shopify API Integration
__turbopack_context__.s([
    "GET",
    ()=>GET,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/node_modules/.pnpm/next@15.5.2_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$shopify$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/xeno/shopify-mt/apps/backend/src/lib/shopify-admin.ts [app-route] (ecmascript)");
;
;
const runtime = "nodejs";
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
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const shop = searchParams.get("shop");
        if (!shop) return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Missing shop"
        }, {
            status: 400
        });
        const end = searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10);
        const start = searchParams.get("startDate") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const limit = Number(searchParams.get("limit") ?? 10);
        const ordersQuery = `created_at:>=${start} created_at:<=${end}`;
        // Fetch orders with customer data from Shopify Admin GraphQL
        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$apps$2f$backend$2f$src$2f$lib$2f$shopify$2d$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["adminFetch"])(shop, TOP_CUSTOMERS_QUERY, {
            ordersQuery,
            first: 250
        });
        const orders = data.orders.edges.map((e)=>e.node).filter((order)=>order.customer);
        // Aggregate customer data
        const customerAgg = new Map();
        for (const order of orders){
            if (!order.customer) continue;
            const customerId = order.customer.id;
            const orderValue = parseFloat(order.totalPriceSet?.shopMoney?.amount || '0');
            const orderDate = new Date(order.createdAt);
            const existing = customerAgg.get(customerId) ?? {
                customerId,
                fullName: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Unknown Customer',
                email: order.customer.email || 'No email',
                totalSpend: 0,
                orderCount: 0,
                avgOrderValue: 0,
                customerSince: order.customer.createdAt ? new Date(order.customer.createdAt).toLocaleDateString('en-IN') : 'Unknown',
                daysSinceLastOrder: 0
            };
            existing.totalSpend += orderValue;
            existing.orderCount += 1;
            // Calculate days since last order (using this order as reference)
            existing.daysSinceLastOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            customerAgg.set(customerId, existing);
        }
        // Calculate AOV and sort by total spend
        const topCustomers = Array.from(customerAgg.values()).map((customer)=>({
                ...customer,
                avgOrderValue: Math.round(customer.totalSpend / customer.orderCount * 100) / 100,
                totalSpend: Math.round(customer.totalSpend * 100) / 100
            })).sort((a, b)=>b.totalSpend - a.totalSpend).slice(0, limit);
        // Customer segments analysis
        const allCustomersData = Array.from(customerAgg.values());
        const segments = {
            vip: allCustomersData.filter((c)=>c.totalSpend >= 25000).length,
            regular: allCustomersData.filter((c)=>c.totalSpend >= 5000 && c.totalSpend < 25000).length,
            casual: allCustomersData.filter((c)=>c.totalSpend < 5000).length
        };
        const totalRevenue = allCustomersData.reduce((sum, c)=>sum + c.totalSpend, 0);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            shop,
            window: {
                start,
                end
            },
            top: topCustomers,
            summary: {
                totalCustomersWithOrders: allCustomersData.length,
                totalUniqueCustomers: allCustomersData.length,
                segments,
                avgCustomerValue: allCustomersData.length > 0 ? Math.round(totalRevenue / allCustomersData.length * 100) / 100 : 0
            }
        });
    } catch (err) {
        console.error('Shopify Top customers error:', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$xeno$2f$shopify$2d$mt$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$2_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: err.message ?? "Unknown error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e1df545c._.js.map