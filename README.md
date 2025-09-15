## Xeno Shopify Assessment App – Multi‑Tenant Analytics with Shopify Admin API

A Next.js Shopify assessment app that connects to Shopify’s Admin GraphQL API for multi‑tenant e-commerce analytics, with an optional relational database backend for data ingestion. The project’s goal is to provide store owners (or a developer assessment reviewer) with a rich analytics dashboard for multiple Shopify stores, including key metrics, trends, and insights. It demonstrates how to integrate Shopify APIs, handle multi-tenant data separation, and seed realistic store data for testing. The dashboard displays live Shopify-backed metrics (not just mock data) – such as total sales, order counts, top customers, etc. – along with charts of revenue/orders over time, and uses Next.js API routes to fetch data on-demand from Shopify.

---

## Tech Stack

- Next.js 13+ (App Router) and React 19 – Frontend framework for the dashboard UI (App Router + React Server Components).
- TypeScript – Strongly typed codebase for reliability.
- Tailwind CSS – Utility-first CSS framework for styling the UI.
- Radix UI and Lucide Icons – Accessible components (dropdowns, tabs, etc.) and icon library for a polished interface.
- TanStack React Query – Data fetching and caching library for seamless API integration.
- NextAuth – Authentication via email magic link and credential login (with a Prisma adapter). In development mode, a demo user login (demo@example.com / demo123) is enabled for convenience.
- Prisma ORM – Database toolkit for MySQL; manages models for stores, customers, orders, etc., and provides a type-safe client. The database (e.g., MySQL/PlanetScale) stores tenant info and optionally cached data.
- MySQL Database – Stores multi-tenant data (Shopify store tokens, and any ingested entities like Orders, Customers, Products for local use).
- Shopify Admin GraphQL API – Primary data source for analytics (orders, customers, products).
- Shopify Storefront GraphQL API – Used for certain operations like product catalog backfill without requiring Admin scope in some cases.
- Shopify Webhooks – Integration to receive real-time updates (order creations, product updates, etc.) from Shopify to keep the app’s database in sync.
- Recharts – Charting library for visualizing trends (used for the Orders & Revenue line chart).
- Node.js (Next.js API Routes) – Backend for the application’s serverless functions (GraphQL proxy, webhooks, admin tools) running within the Next.js app.
- Deployment: Vercel for hosting the app (Next.js serverless deployment) for the live demo.

---

## Features

### Multi‑Tenant Support
The app supports multiple Shopify store tenants in one instance. Each request is scoped by a `?shop=<my-shop>.myshopify.com` query parameter identifying the store. This ensures data is isolated per shop. The app resolves the appropriate API credentials for the given shop domain, either by looking up an access token in the database or using environment variables. This approach allows a single dashboard UI to serve analytics for any number of shops by switching the `shop` parameter (in a real app, an OAuth flow would install the app per store and store tokens in the DB).

### Customer & Order Analytics Dashboard
- KPI Summary Cards: Total Products, Customers, Orders, GMV, and AOV for the selected date range.
- Date Range Selector: Preset ranges (last 7, 14, 30 days) or a custom date range.
- Revenue & Orders Trend Chart: Combined chart plotting orders and revenue over time, optionally AOV.
- New vs Returning Customers: Breakdown for the period, using Shopify customer and order data.
- Fulfillment Status: Split of order fulfillment statuses and median fulfillment time (SLA).
- Top Customers: Top customers by total spend with counts of orders.
- Recent Products: Recently created products for quick visibility of newest offerings.
- Live Orders Table: Paginated, searchable, filterable (status), sortable (date/total), with auto-refresh.

### Real-Time Shopify Integration
The app queries Shopify’s APIs on-the-fly for up-to-date information. All dashboard metrics and charts are powered by Next.js API routes that proxy requests to Shopify’s Admin GraphQL API using the store’s access token. Highlights:
- GraphQL queries to Shopify Admin API for analytics endpoints and selective REST/GraphQL calls as needed.
- Secure token handling: tokens never exposed to the client; server routes return summaries only.
- Storefront API usage for certain operations (e.g., full product listing for backfill where suitable).
- Webhooks endpoints for products/orders to verify HMAC and upsert local DB entities when enabled.

### Admin Seeding Tools
Admin API endpoints help seed realistic data into a Shopify development store for demo purposes:
- `POST /api/admin/seed-shopify` – Creates a batch of realistic customers and orders (idempotent, safe).
- `POST /api/admin/fulfill-recent` – Marks a percentage of recent orders as fulfilled to simulate SLA metrics.

All seeding uses Shopify’s Admin API, so created data appears in the Shopify admin as real entities.

### Authentication & Security
NextAuth protects the dashboard behind login. Sign-in via email magic-link (if SMTP configured) or demo credentials (for local dev). NextAuth is configured with a Prisma adapter to store users/sessions. In production, use Shopify OAuth and restrict shop access by ownership.

### Extensibility & Modern Architecture
Built on the latest Next.js App Router with modular API routes in `src/app/api` and a UI leveraging React Server Components. Input validation, safe JSON utilities, and a clean repository structure make it straightforward to extend (e.g., add inventory analytics or funnel metrics).

---

## Setup Instructions

### 1) Clone & Install
```bash
pnpm install
```

### 2) Configure Environment Variables
Create a `.env` with at least:

- `DATABASE_URL` – MySQL connection string, e.g. `mysql://user:pass@localhost:3306/mydb`
- Shopify App Credentials – `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_SCOPES` (e.g. `read_products,read_orders,read_customers,read_all_orders`)
- App URL – `SHOPIFY_APP_URL` (e.g., your ngrok URL locally or Vercel URL in prod)
- Per‑store Admin tokens – either a shared `SHOPIFY_ACCESS_TOKEN` or per‑shop envs like `SHOPIFY_TOKEN_TENANT_A_DEMO_MYSHOPIFY_COM`
- NextAuth – `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and optionally SMTP creds (`EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`)

This repository includes an `env.ts` schema to validate required variables.

### 3) Database Setup & Migrations
```bash
pnpm db:migrate
```

### 4) Start the Dev Server
```bash
pnpm dev
```

Open: `http://localhost:3000/dashboard?shop=tenant-a-demo.myshopify.com` and sign in (demo credentials or email link).

### 5) Seed Data (optional for empty dev stores)
```bash
curl -X POST "http://localhost:3000/api/admin/seed-shopify?shop=tenant-a-demo.myshopify.com&customers=20&orders=20"
```

---

## Deployment

Deployed on Vercel (recommended). Append `?shop=<shop-domain>` to the dashboard URL to select a tenant. Ensure all environment variables and store tokens are configured in the Vercel project settings.

---

## Screenshots

Add screenshots to the `public/` folder and reference them here.

---

## Architecture Diagram

![Architecture Diagram](shopify-ui/public/Untitled%20Diagram.jpg)

The architecture consists of the Next.js frontend (browser-based React app), Next.js API routes (serverless functions on Vercel) for analytics and admin operations, a MySQL database via Prisma, and Shopify’s external services (Admin API, Storefront API, and Webhooks).

---

## Known Issues & Limitations

- Historical Data & Backdating: Shopify does not allow setting custom order creation dates, so seeded orders are recent. For historical analytics beyond 60 days, enable `read_all_orders` and consider Bulk Operations.
- Pagination: Orders table uses forward-only cursor pagination (Next button). A “Previous” flow can be added later.
- Performance on Large Stores: Live queries may be slow or rate-limited. Prefer Bulk Operations, caching, and background sync for very large datasets.
- Multi-Tenant Onboarding: Tokens are configured manually for the demo. A full OAuth install flow is scaffolded but not finalized.
- Data Consistency: Live API ensures accuracy, but if any local caching is enabled via webhooks, slight delays are possible until events are processed.
- UI/UX Enhancements: Functional focus over polish; spinners, richer error states, and mobile refinements can be improved. Not using Polaris (custom Tailwind design).

---

## Redundant or Removable Files

- Debug API routes in `src/app/api/debug/*` used for experimentation are not required for core flows.
- Mock analytics endpoints like `products-mock` and `products-local` can be removed if exclusively using live Shopify data.
- Backfill scripts (e.g., `backfill-orders`, `backfill-products-sfo`) are optional; keep only if needed for local analytics or testing.
- Dev shell scripts (e.g., `seed-data.sh`, `create-orders.sh`) are convenience tools; not required for runtime.

---

## Credits & Attribution

This project was developed by C. Vishnu Adithya as part of the Xeno Shopify Assessment. It uses open-source libraries including Next.js, NextAuth, Prisma, Tailwind CSS, TanStack React Query, Recharts, Radix UI, and Faker.

Shopify-related trademarks are the property of Shopify Inc. This project is for demonstration purposes and is not an official Shopify product.


