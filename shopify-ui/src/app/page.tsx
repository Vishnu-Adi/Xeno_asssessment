import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />

        <div className="text-center space-y-6">
          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
            New • Multi-tenant Shopify analytics
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Xeno Analytics
          </h1>
          <p className="mx-auto max-w-2xl text-slate-300 text-lg">
            Modern, multi-tenant insights with beautiful visualizations and real-time updates.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/signin" className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Open Dashboard
            </Link>
            <a href="#features" className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700">
              Learn more
            </a>
          </div>
        </div>

        <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-white font-semibold mb-2">📊 Advanced Analytics</h3>
            <p className="text-slate-300">Customer cohorts, product performance, and revenue insights.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-white font-semibold mb-2">🔄 Real-time Data</h3>
            <p className="text-slate-300">Webhook-driven updates with multi-tenant architecture.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-white font-semibold mb-2">🛡️ Enterprise Ready</h3>
            <p className="text-slate-300">Auth, RBAC, and production-grade reliability.</p>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-slate-400">
          Demo: <code className="rounded bg-slate-800 px-1">demo@example.com</code> / <code className="rounded bg-slate-800 px-1">demo123</code>
        </div>
      </div>
    </div>
  )
}