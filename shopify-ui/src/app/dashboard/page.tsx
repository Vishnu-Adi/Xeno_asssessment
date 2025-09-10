'use client'

import { useMemo, useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

type SummaryResponse = { totalRevenue: number; ordersCount: number; aov: number }
type Order = {
  shopifyOrderId: string | number
  createdAt: string
  status: string
  currency: string
  totalPrice: string | number
}

type OrdersResponse = { items: Order[]; nextCursor: string | null }

const client = new QueryClient()

export default function DashboardPage() {
  return (
    <QueryClientProvider client={client}>
      <DashboardClient />
    </QueryClientProvider>
  )
}

type RangeType = '7d' | '30d' | 'custom'

function getRange(range: RangeType, customFrom?: string, customTo?: string) {
  const now = new Date()
  const to = customTo ? new Date(customTo) : now
  let from: Date
  if (range === '7d') from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  else if (range === '30d') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  else from = customFrom ? new Date(customFrom) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return { from, to }
}

function DashboardClient() {
  const [shop, setShop] = useState<string>('a.myshopify.com')
  const [range, setRange] = useState<RangeType>('7d')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [limit] = useState<number>(20)

  const { from, to } = useMemo(() => getRange(range, customFrom, customTo), [range, customFrom, customTo])

  const params = new URLSearchParams()
  params.set('shop', shop)
  params.set('from', from.toISOString())
  params.set('to', to.toISOString())

  const summaryQuery = useQuery<SummaryResponse>({
    queryKey: ['summary', shop, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/summary?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    placeholderData: (prev) => prev,
    refetchInterval: 15000
  })

  const ordersQuery = useQuery<OrdersResponse>({
    queryKey: ['orders', shop, from.toISOString(), to.toISOString(), cursor ?? ''],
    queryFn: async () => {
      const p = new URLSearchParams(params)
      p.set('limit', String(limit))
      if (cursor) p.set('cursor', cursor)
      const res = await fetch(`/api/orders?${p.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
    placeholderData: (prev) => prev,
    refetchInterval: 15000
  })

  const dailySeries = useMemo(() => {
    const byDay = new Map<string, number>()
    const items = ordersQuery.data?.items ?? []
    for (const o of items) {
      const day = new Date(o.createdAt).toISOString().slice(0, 10)
      const total = typeof o.totalPrice === 'string' ? parseFloat(o.totalPrice) : Number(o.totalPrice)
      byDay.set(day, (byDay.get(day) ?? 0) + (isNaN(total) ? 0 : total))
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, revenue]) => ({ date, revenue }))
  }, [ordersQuery.data])

  const gmv = summaryQuery.data?.totalRevenue ?? 0
  const ordersCount = summaryQuery.data?._count ?? undefined // safeguard if API changes
  const aov = summaryQuery.data?.aov ?? 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-gray-600">Shop Domain</label>
          <input
            className="mt-1 w-64 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="example.myshopify.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Range</label>
          <div className="mt-1 flex gap-2">
            <button
              className={`px-3 py-2 rounded border ${range === '7d' ? 'bg-gray-900 text-white' : 'border-gray-300'}`}
              onClick={() => { setRange('7d'); setCursor(null) }}
            >Last 7d</button>
            <button
              className={`px-3 py-2 rounded border ${range === '30d' ? 'bg-gray-900 text-white' : 'border-gray-300'}`}
              onClick={() => { setRange('30d'); setCursor(null) }}
            >Last 30d</button>
            <button
              className={`px-3 py-2 rounded border ${range === 'custom' ? 'bg-gray-900 text-white' : 'border-gray-300'}`}
              onClick={() => { setRange('custom'); setCursor(null) }}
            >Custom</button>
          </div>
        </div>
        {range === 'custom' && (
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm text-gray-600">From</label>
              <input
                type="date"
                className="mt-1 rounded border border-gray-300 px-3 py-2"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">To</label>
              <input
                type="date"
                className="mt-1 rounded border border-gray-300 px-3 py-2"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <KpiRow
        loading={summaryQuery.isLoading}
        gmv={gmv}
        orders={summaryQuery.data?.ordersCount ?? 0}
        aov={aov}
      />

      <section className="rounded border border-gray-200 p-4">
        <h2 className="mb-4 text-lg font-medium">Revenue by Day</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={dailySeries} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Orders</h2>
          <div className="flex gap-2">
            <button
              className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-50"
              onClick={() => setCursor(null)}
              disabled={!cursor}
            >Reset</button>
            <button
              className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-50"
              onClick={() => setCursor(ordersQuery.data?.nextCursor ?? null)}
              disabled={!ordersQuery.data?.nextCursor}
            >Next</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(ordersQuery.data?.items ?? []).map((o) => (
                <tr key={String(o.shopifyOrderId)} className="border-b last:border-none">
                  <td className="px-3 py-2">#{String(o.shopifyOrderId)}</td>
                  <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 capitalize">{o.status}</td>
                  <td className="px-3 py-2">{formatCurrency(o.totalPrice, o.currency)}</td>
                </tr>
              ))}
              {ordersQuery.isLoading && (
                <tr>
                  <td className="px-3 py-6 text-gray-500" colSpan={4}>Loading orders…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function KpiRow({ loading, gmv, orders, aov }: { loading: boolean; gmv: number; orders: number; aov: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard title="GMV" value={loading ? '—' : formatCurrency(gmv, 'USD')} />
      <KpiCard title="Orders" value={loading ? '—' : orders.toLocaleString()} />
      <KpiCard title="AOV" value={loading ? '—' : formatCurrency(aov, 'USD')} />
    </div>
  )
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function formatCurrency(value: number | string, currency: string) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}


