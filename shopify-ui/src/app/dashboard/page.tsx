'use client'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const STORES = ['tenant-a-demo.myshopify.com','tenant-b-demo.myshopify.com']

type Summary = {
  productCount: number
  newProducts7d: number
  activeCheckouts24h: number
  checkoutValue24h: number
  completionRate7d: number
}

function DashboardContent() {
  const sp = useSearchParams()
  const shop = sp.get('shop') ?? STORES[0]

  const summary = useQuery({
    queryKey: ['summary', shop],
    queryFn: async () => (await fetch(`/api/analytics/summary?shop=${shop}`)).json() as Promise<Summary>,
    refetchInterval: 15000
  })
  const series = useQuery({
    queryKey: ['series', shop],
    queryFn: async () => (await fetch(`/api/analytics/checkouts-series?shop=${shop}`)).json() as Promise<{day:string;revenue:number;checkouts:number}[]>,
    refetchInterval: 15000
  })
  const recent = useQuery({
    queryKey: ['recentProducts', shop],
    queryFn: async () => (await fetch(`/api/products/recent?shop=${shop}`)).json() as Promise<{items:any[]}>,
    refetchInterval: 15000
  })

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Store:</span>
        <select
          value={shop}
          onChange={(e)=>location.assign(`/dashboard?shop=${e.target.value}`)}
          className="border rounded px-2 py-1"
        >
          {STORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi label="Products" value={summary.data?.productCount ?? 0} />
        <Kpi label="New (7d)" value={summary.data?.newProducts7d ?? 0} />
        <Kpi label="Active checkouts (24h)" value={summary.data?.activeCheckouts24h ?? 0} />
        <Kpi label="Checkout value (24h)" value={`₹${(summary.data?.checkoutValue24h ?? 0).toFixed(2)}`} />
        <Kpi label="Completion rate (7d)" value={`${Math.round((summary.data?.completionRate7d ?? 0)*100)}%`} />
      </div>

      {/* Chart */}
      <div className="h-64 w-full border rounded p-3">
        <h3 className="font-medium mb-2">Revenue from checkouts (7d)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.data ?? []}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent products */}
      <div>
        <h3 className="font-medium mb-2">Recent products</h3>
        <ul className="divide-y rounded border">
          {(recent.data?.items ?? []).map(p => (
            <li key={p.id} className="p-3 flex justify-between">
              <span className="truncate">{p.title}</span>
              <span className="text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

function Kpi({ label, value }: {label:string; value: any}) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}