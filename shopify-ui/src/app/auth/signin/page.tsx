'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        setMessage('Invalid credentials. Please try again.')
      } else if (result?.ok) {
        setMessage('Sign in successful! Redirecting...')
        router.push('/dashboard')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        if (result.error === 'Configuration') {
          setMessage('Email service is not configured. Please use the demo credentials above or contact support.')
        } else {
          setMessage('Failed to send magic link. Please try again.')
        }
      } else {
        setMessage('Magic link sent! Check your email.')
      }
    } catch (error) {
      setMessage('Email service is not available. Please use the demo credentials above.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <span className="text-white font-semibold text-xl">Xeno Analytics</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to access your analytics dashboard</p>
        </div>

        {/* Main Sign In Card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-2xl blur opacity-30"></div>
          <Card className="relative bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-white text-2xl">Demo Access</CardTitle>
              <CardDescription className="text-slate-400">
                Use demo credentials to explore the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Demo Credentials Info */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="text-center space-y-2">
                  <p className="text-slate-300 text-sm font-medium">Demo Credentials</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-400">
                      Email: <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">demo@example.com</code>
                    </p>
                    <p className="text-slate-400">
                      Password: <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">demo123</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@example.com"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="demo123"
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
                    required
                  />
                </div>
                
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('successful') 
                      ? 'bg-green-900/30 border border-green-700/50 text-green-400' 
                      : message.includes('sent')
                      ? 'bg-blue-900/30 border border-blue-700/50 text-blue-400'
                      : 'bg-red-900/30 border border-red-700/50 text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/25"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Access Dashboard'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Magic Link Form */}
              <div className="space-y-4">
                <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <p className="text-amber-400 text-sm text-center">
                    ⚠️ Magic link authentication is not configured. Use demo credentials above.
                  </p>
                </div>
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-slate-300">Email for Magic Link</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    variant="outline"
                    className="w-full bg-slate-900/50 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-cyan-500 transition-all duration-300"
                  >
                    Send Magic Link
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-slate-500 text-sm">
            Don't have an account? This is a demo platform - use the credentials above.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back to homepage
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
            <div className="text-purple-400 text-xl mb-1">📊</div>
            <div className="text-slate-400 text-xs">Analytics</div>
          </div>
          <div className="p-3 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
            <div className="text-cyan-400 text-xl mb-1">⚡</div>
            <div className="text-slate-400 text-xs">Real-time</div>
          </div>
          <div className="p-3 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
            <div className="text-pink-400 text-xl mb-1">🛡️</div>
            <div className="text-slate-400 text-xs">Secure</div>
          </div>
        </div>
      </div>
    </div>
  )
}