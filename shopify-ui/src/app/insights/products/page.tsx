'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STORES = ['tenant-a-demo.myshopify.com', 'tenant-b-demo.myshopify.com']

export default function ProductInsightsPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const shop = sp.get('shop') ?? STORES[0]

  const q = useQuery({
    queryKey: ['product-performance', shop],
    queryFn: async () => (await fetch(`/api/analytics/product-performance?shop=${shop}`)).json(),
    enabled: Boolean(shop),
    refetchInterval: 30000,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">← Back to Dashboard</Link>
            <div className="h-6 w-px bg-slate-700" />
            <span className="text-white font-semibold">Product Insights</span>
            <div className="h-6 w-px bg-slate-700" />
            <select 
              value={shop}
              onChange={(e) => router.push(`/insights/products?shop=${e.target.value}`)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              {STORES.map(s => <option key={s} value={s}>{s.split('.')[0]}</option>)}
            </select>
          </div>
          <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">Last 30 days</Badge>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{q.data?.insights?.totalProducts ?? 0}</div>
                  <div className="text-slate-400 text-xs">Products</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{q.data?.insights?.newProducts ?? 0}</div>
                  <div className="text-slate-400 text-xs">New</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${(q.data?.insights?.totalRevenue ?? 0).toFixed(2)}</div>
                  <div className="text-slate-400 text-xs">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Trending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(q.data?.trending ?? []).map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium truncate max-w-64">{p.title}</p>
                        <p className="text-slate-400 text-xs">Score: {Math.round(p.performance.performanceScore)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-semibold">${p.metrics.revenue.toFixed(2)}</div>
                        <div className="text-slate-400 text-xs">{p.metrics.purchases} purchases</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All products */}
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(q.data?.products ?? []).map((p: any) => (
                <div key={p.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-white font-medium truncate max-w-64">{p.title}</p>
                  <div className="text-slate-400 text-xs mt-1">Views: {p.metrics.views} • Cart Adds: {p.metrics.cartAdds}</div>
                  <div className="text-slate-300 text-sm mt-2">Revenue ${p.metrics.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


