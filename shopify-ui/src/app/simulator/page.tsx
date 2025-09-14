'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STORES = ['tenant-a-demo.myshopify.com', 'tenant-b-demo.myshopify.com']

export default function SimulatorPage() {
  const [shop, setShop] = useState(STORES[0])
  const [token, setToken] = useState('')
  const [count, setCount] = useState(5)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function runBackfill() {
    setBusy(true)
    try {
      await fetch('/api/admin/backfill-products-sfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, token, first: 50 })
      })
    } finally {
      setBusy(false)
    }
  }

  async function seedCarts() {
    setBusy(true)
    try {
      await fetch('/api/debug/seed-carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, token, count })
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Data Simulator (Storefront-only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Store</label>
                <select value={shop} onChange={(e) => setShop(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">Storefront API Token</label>
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="shpat_..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Carts to create</label>
              <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-32 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div className="flex gap-3">
              <Button disabled={busy || !token} onClick={runBackfill} className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">Backfill Products</Button>
              <Button disabled={busy || !token} onClick={seedCarts} className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">Seed Carts</Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard?shop=${shop}`)} className="border-slate-700 text-slate-300">Go to Dashboard</Button>
            </div>
            <p className="text-slate-400 text-sm">We never store your Storefront token; it is used only for this request from your browser.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


