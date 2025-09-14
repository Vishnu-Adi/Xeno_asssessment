'use client'

import React, { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Activity, 
  RefreshCw, 
  LogOut, 
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  MousePointer,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

const STORES = ['tenant-a-demo.myshopify.com', 'tenant-b-demo.myshopify.com']
const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b']

type Summary = {
  productCount: number
  newProducts7d: number
  activeCheckouts24h: number
  checkoutValue24h: number
  completionRate7d: number
  source: 'checkout' | 'cart' | 'none'
}

type TopCustomer = {
  shopifyCustomerId: string
  email: string
  fullName: string
  totalSpend: number
  orderCount: number
  avgOrderValue: number
}

type OrdersByDate = {
  dateRange: { start: string; end: string; status: string }
  summary: { totalOrders: number; totalRevenue: number; avgOrderValue: number }
  chartData: { date: string; orderCount: number; totalRevenue: number }[]
  recentOrders: any[]
}

// Beautiful metric card component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon, 
  gradient 
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon: any
  gradient: string
}) => {
  return (
    <div className="group relative overflow-hidden">
      <div className="absolute -inset-0.5 bg-gradient-to-r opacity-20 group-hover:opacity-30 transition-opacity duration-300 rounded-2xl blur" 
           style={{ background: gradient }}></div>
      <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                 style={{ background: `linear-gradient(135deg, ${gradient})` }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{title}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
          {change && changeType !== 'neutral' && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
              changeType === 'up' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {changeType === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const sp = useSearchParams()
  const router = useRouter()
  const shop = sp.get('shop') ?? STORES[0]
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [orderStatus, setOrderStatus] = useState('all')

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const summary = useQuery({
    queryKey: ['summary', shop],
    queryFn: async () => (await fetch(`/api/analytics/summary?shop=${shop}`)).json() as Promise<Summary>,
    refetchInterval: 0,
    enabled: Boolean(session && shop)
  })

  const topCustomers = useQuery({
    queryKey: ['topCustomers', shop],
    queryFn: async () => (await fetch(`/api/analytics/top-customers?shop=${shop}`)).json() as Promise<{ customers: TopCustomer[] }>,
    refetchInterval: 60000,
    enabled: Boolean(session && shop)
  })

  const ordersByDate = useQuery({
    queryKey: ['ordersByDate', shop, dateRange.start, dateRange.end, orderStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        shop,
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(orderStatus !== 'all' && { status: orderStatus })
      })
      return (await fetch(`/api/analytics/orders-by-date?${params}`)).json() as Promise<OrdersByDate>
    },
    refetchInterval: 60000,
    enabled: Boolean(session && shop)
  })

  const series = useQuery({
    queryKey: ['series', shop],
    queryFn: async () => (await fetch(`/api/analytics/checkouts-series?shop=${shop}`)).json(),
    refetchInterval: 0,
    enabled: Boolean(session && shop)
  })

  const recent = useQuery({
    queryKey: ['recentProducts', shop],
    queryFn: async () => (await fetch(`/api/products/recent?shop=${shop}`)).json(),
    refetchInterval: 60000,
    enabled: Boolean(session && shop)
  })

  // Handle authentication redirect
  React.useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  // Attach SSE for live summary updates
  React.useEffect(() => {
    if (!session) return
    const es = new EventSource(`/api/realtime/summary?shop=${shop}`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        // Optimistically update react-query cache
        // @ts-ignore
        summary.client.setQueryData(['summary', shop], data)
      } catch {}
    }
    return () => es.close()
  }, [session, shop])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">X</span>
                </div>
                <span className="text-white font-semibold text-lg">Xeno Analytics</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-sm">Store:</span>
                <select 
                  value={shop} 
                  onChange={(e) => router.push(`/dashboard?shop=${e.target.value}`)}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                >
                  {STORES.map(s => (
                    <option key={s} value={s}>{s.split('.')[0]}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                <Settings className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-slate-400 text-xs">Administrator</p>
                </div>
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {session.user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-slate-400">
                Here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={async () => {
                  const token = prompt('Enter Storefront API token for this shop (remains local)')
                  if (!token) return
                  await fetch('/api/admin/backfill-products-sfo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shop, token, first: 50 })
                  })
                  await fetch('/api/debug/seed-carts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shop, token, count: 5 })
                  })
                  window.location.reload()
                }}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Quick Simulate
              </Button>
            </div>
          </div>

          {/* Data Source Badge */}
          {summary.data?.source && (
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className="bg-slate-800/50 border-slate-700 text-slate-300"
              >
                Data Source: {summary.data.source === 'checkout' ? 'Checkout Events' : summary.data.source === 'cart' ? 'Cart Events' : 'No data'}
              </Badge>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`$${(summary.data?.checkoutValue24h ?? 0).toFixed(2)}`}
              change="12.5%"
              changeType="up"
              icon={DollarSign}
              gradient="linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)"
            />
            <MetricCard
              title="Active Checkouts"
              value={summary.data?.activeCheckouts24h ?? 0}
              change="8.2%"
              changeType="up"
              icon={ShoppingCart}
              gradient="linear-gradient(135deg, #06b6d4 0%, #10b981 100%)"
            />
            <MetricCard
              title="Products"
              value={summary.data?.productCount ?? 0}
              change="3.1%"
              changeType="up"
              icon={Package}
              gradient="linear-gradient(135deg, #10b981 0%, #f59e0b 100%)"
            />
            <MetricCard
              title="Completion Rate"
              value={`${Math.round((summary.data?.completionRate7d ?? 0) * 100)}%`}
              change="2.4%"
              changeType="down"
              icon={Activity}
              gradient="linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 rounded-2xl blur"></div>
                <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-xl">Revenue Trend</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
                          7 days
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series.data ?? []}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="day" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#f1f5f9'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Top Products */}
            <div className="relative overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 opacity-20 rounded-2xl blur"></div>
              <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Recent Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(recent.data?.items ?? []).slice(0, 5).map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-32">
                              {product.title}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {new Date(product.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-slate-700 border-slate-600 text-slate-300">
                          New
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20 rounded-2xl blur"></div>
              <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">New Products (7d)</p>
                      <p className="text-2xl font-bold text-white">{summary.data?.newProducts7d ?? 0}</p>
                    </div>
                    <Package className="w-8 h-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 rounded-2xl blur"></div>
              <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Avg. Order Value</p>
                      <p className="text-2xl font-bold text-white">
                        ${((summary.data?.checkoutValue24h ?? 0) / Math.max(summary.data?.activeCheckouts24h ?? 1, 1)).toFixed(2)}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 rounded-2xl blur"></div>
              <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Conversion Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round((summary.data?.completionRate7d ?? 0) * 100)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Orders By Date and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 rounded-2xl blur"></div>
                <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-xl">Orders by Date</CardTitle>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">{orderStatus}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ordersByDate.data?.chartData ?? []}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                          <Bar dataKey="orderCount" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 rounded-2xl blur"></div>
              <Card className="relative bg-slate-900/90 backdrop-blur-sm border-slate-800 h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(topCustomers.data?.customers ?? []).map((c, idx) => (
                      <div key={c.shopifyCustomerId + idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">{c.fullName}</p>
                          <p className="text-slate-400 text-xs">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-semibold">${c.totalSpend.toFixed(2)}</p>
                          <p className="text-slate-400 text-xs">{c.orderCount} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}