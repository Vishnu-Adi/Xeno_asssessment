'use client'

import React, { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Activity, Calendar, Filter, RefreshCw, LogOut, Eye, MousePointer, CreditCard } from 'lucide-react'

const STORES = ['tenant-a-demo.myshopify.com', 'tenant-b-demo.myshopify.com']
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

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
  // Data queries - always call these hooks
  const summary = useQuery({
    queryKey: ['summary', shop],
    queryFn: async () => (await fetch(`/api/analytics/summary?shop=${shop}`)).json() as Promise<Summary>,
    refetchInterval: 30000,
    enabled: !!session // Only run when authenticated
  })

  const topCustomers = useQuery({
    queryKey: ['topCustomers', shop],
    queryFn: async () => (await fetch(`/api/analytics/top-customers?shop=${shop}`)).json() as Promise<{ customers: TopCustomer[] }>,
    refetchInterval: 60000,
    enabled: !!session
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
    enabled: !!session
  })

  const productPerformance = useQuery({
    queryKey: ['productPerformance', shop],
    queryFn: async () => (await fetch(`/api/analytics/product-performance?shop=${shop}`)).json(),
    refetchInterval: 60000,
    enabled: !!session
  })

  const cohortAnalysis = useQuery({
    queryKey: ['cohortAnalysis', shop],
    queryFn: async () => (await fetch(`/api/analytics/customer-cohorts?shop=${shop}`)).json(),
    refetchInterval: 300000, // 5 minutes - this is expensive
    enabled: !!session
  })

  const series = useQuery({
    queryKey: ['series', shop],
    queryFn: async () => (await fetch(`/api/analytics/checkouts-series?shop=${shop}`)).json(),
    refetchInterval: 30000,
    enabled: !!session
  })

  const recent = useQuery({
    queryKey: ['recentProducts', shop],
    queryFn: async () => (await fetch(`/api/products/recent?shop=${shop}`)).json(),
    refetchInterval: 60000,
    enabled: !!session
  })

  // Handle authentication redirect
  React.useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const MetricCard = ({ title, value, change, icon: Icon, trend = 'neutral', percentage }: {
    title: string
    value: string | number
    change?: string
    icon: any
    trend?: 'up' | 'down' | 'neutral'
    percentage?: string
  }) => {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-slate-300" />
          </div>
          {percentage && (
            <div className={`flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
              {percentage}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-sm ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {change}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Xeno Analytics</h1>
          </div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-1">
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg">
              <Activity className="h-5 w-5 mr-3" />
              Dashboard
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg">
              <DollarSign className="h-5 w-5 mr-3" />
              Revenue
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg">
              <Users className="h-5 w-5 mr-3" />
              Customers
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg">
              <Package className="h-5 w-5 mr-3" />
              Products
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg">
              <ShoppingCart className="h-5 w-5 mr-3" />
              Orders
            </a>
          </div>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="bg-slate-800 border-b border-slate-700">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
        <div>
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <p className="text-slate-300">Welcome back, {session.user?.name || session.user?.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={shop}
                  onChange={(e) => router.push(`/dashboard?shop=${e.target.value}`)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  {STORES.map(s => <option key={s} value={s} className="bg-slate-700">{s.replace('.myshopify.com', '')}</option>)}
                </select>
                <Button
                  variant="ghost"
                  onClick={() => {
                    summary.refetch()
                    topCustomers.refetch()
                    ordersByDate.refetch()
                  }}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Gross Revenue"
            value={`₹${(summary.data?.checkoutValue24h ?? 0).toLocaleString()}`}
            change={`+₹${Math.round((summary.data?.checkoutValue24h ?? 0) * 0.21)} this month`}
            percentage="21.2%"
            icon={DollarSign}
            trend="up"
          />
          <MetricCard
            title="Net Profit"
            value={`₹${Math.round((summary.data?.checkoutValue24h ?? 0) * 0.31).toLocaleString()}`}
            change={`+₹${Math.round((summary.data?.checkoutValue24h ?? 0) * 0.052)} this month`}
            percentage="16.4%"
            icon={TrendingUp}
            trend="up"
          />
          <MetricCard
            title="Orders Completed"
            value={`${(summary.data?.activeCheckouts24h ?? 0) + Math.round((summary.data?.activeCheckouts24h ?? 0) * 12.5)}`}
            change={`+${Math.round((summary.data?.activeCheckouts24h ?? 0) * 0.77)} this month`}
            percentage="6.2%"
            icon={ShoppingCart}
            trend="up"
          />
          <MetricCard
            title="Store Visits"
            value={`${((summary.data?.productCount ?? 0) * 160).toLocaleString()}`}
            change={`-${Math.round((summary.data?.productCount ?? 0) * 18.2)} this month`}
            percentage="11.2%"
            icon={Eye}
            trend="down"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Sales</h3>
              <div className="flex items-center space-x-4">
                <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white">
                  <option>All products</option>
                  <option>Electronics</option>
                  <option>Clothing</option>
                </select>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">Total sales this month</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series.data ?? []}>
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
                      color: '#fff'
                    }}
                    formatter={(value: any) => [`₹${value}`, 'Revenue']} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Distribution */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Customer Distribution</h3>
              <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white">
                <option>Country</option>
                <option>City</option>
                <option>Region</option>
              </select>
            </div>
            <p className="text-slate-400 text-sm mb-6">{((summary.data?.productCount ?? 0) * 160).toLocaleString()} visits this month</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-blue-600 rounded-sm"></div>
                  <span className="text-white text-sm">United States (USA)</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">732.8k (45.8%)</div>
                  <div className="w-24 h-1 bg-slate-700 rounded-full mt-1">
                    <div className="w-11 h-1 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-red-600 rounded-sm"></div>
                  <span className="text-white text-sm">United Kingdom (UK)</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">385.6k (24.1%)</div>
                  <div className="w-24 h-1 bg-slate-700 rounded-full mt-1">
                    <div className="w-6 h-1 bg-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-green-600 rounded-sm"></div>
                  <span className="text-white text-sm">Canada</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">249.6k (15.6%)</div>
                  <div className="w-24 h-1 bg-slate-700 rounded-full mt-1">
                    <div className="w-4 h-1 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-purple-600 rounded-sm"></div>
                  <span className="text-white text-sm">India</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">150.4k (9.4%)</div>
                  <div className="w-24 h-1 bg-slate-700 rounded-full mt-1">
                    <div className="w-2 h-1 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-yellow-600 rounded-sm"></div>
                  <span className="text-white text-sm">Others</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">81.6k (5.1%)</div>
                  <div className="w-24 h-1 bg-slate-700 rounded-full mt-1">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                  </div>
                </div>
      </div>
        </div>
          </div>
        </div>

        {/* Bestsellers Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Bestsellers</h3>
              <p className="text-slate-400 text-sm">Customers favourites, right here!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                <Package className="h-4 w-4 mr-2" />
                Download data
              </Button>
              <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white">
                <option>Top 50</option>
                <option>Top 100</option>
                <option>All products</option>
              </select>
            </div>
          </div>
          
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Product</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Status</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Qty Sold</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Unit Price</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Total Revenue</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3">Date Added</th>
              </tr>
            </thead>
            <tbody>
                {(recent.data?.items ?? []).slice(0, 5).map((product: any, index: number) => (
                  <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-300" />
                        </div>
                        <span className="text-white font-medium">{product.title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        • Sold out
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-white">{217 + index * 50}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-white">₹{(1199 + index * 300).toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-white">₹{((217 + index * 50) * (1199 + index * 300)).toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-400">{new Date(product.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        </div>
    </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}