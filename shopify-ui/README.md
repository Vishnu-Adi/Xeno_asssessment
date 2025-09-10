## Multi-tenant Shopify App Scaffold (API-only)

This repo provides a minimal, tenant-safe scaffold for a Shopify app using Next.js App Router, Prisma (MySQL), and type-safe repos.

### Environment
Create `.env.local` with:
```
DATABASE_URL=mysql://user:pass@localhost:3306/shopify_mt
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_orders,read_products,read_customers
SHOPIFY_APP_URL=http://localhost:3000
SHOPIFY_REDIRECT_PATH=/api/oauth/callback
```

### Prisma
- Provider: MySQL
- All tables have `tenantId BINARY(16)` and unique/indexes are tenant-first.

Commands:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Development
```bash
pnpm dev
```

### API Routes
- OAuth install: `GET /api/oauth/install?shop={shop-domain}`
- OAuth callback: `GET /api/oauth/callback`
- Webhooks (raw body + HMAC):
  - `POST /api/webhooks/orders/create`
  - `POST /api/webhooks/orders/updated`
  - `POST /api/webhooks/customers/create`
  - `POST /api/webhooks/customers/updated`
  - `POST /api/webhooks/products/create`
  - `POST /api/webhooks/products/updated`
- Dashboard:
  - `GET /api/analytics/summary?shop=...&from=...&to=...`
  - `GET /api/orders?shop=...&from=...&to=...&status=...&limit=...&cursor=...`

### Notes
- No WebSockets; polling can be added later.
- All repos require `{ tenantId: Buffer }` and perform scoped queries.
