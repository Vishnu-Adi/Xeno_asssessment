'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      console.log('Attempting sign in with:', { email, password })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      console.log('Sign in result:', result)

      if (result?.error) {
        setMessage(`Authentication failed: ${result.error}. Please try: demo@example.com / demo123`)
        console.error('Sign in error:', result.error)
      } else if (result?.ok) {
        setMessage('Success! Redirecting...')
        // Force a small delay to ensure session is set
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setMessage('Authentication failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
      })

      if (result?.error) {
        setMessage('Failed to send email. Please try again.')
      } else {
        setMessage('Check your email for a sign-in link!')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to Xeno Analytics</h1>
          <p className="text-slate-300 mt-2">Sign in to access your Shopify insights dashboard</p>
        </div>

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 text-slate-300">
            <TabsTrigger value="credentials">Demo Login</TabsTrigger>
            <TabsTrigger value="email">Email Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="credentials">
            <Card className="border-slate-700 bg-slate-800 text-slate-200">
              <CardHeader>
                <CardTitle>Demo Account</CardTitle>
                <CardDescription>
                  Use demo credentials to explore the dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCredentialsSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="demo@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="demo123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {message && (
                    <div className={`text-sm p-3 rounded ${
                      message.includes('error') || message.includes('failed') || message.includes('Invalid') 
                        ? 'bg-red-950 text-red-300 border border-red-900' 
                        : 'bg-green-900/30 text-green-300 border border-green-900'
                    }`}>
                      {message}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-slate-700 bg-slate-800 text-slate-200">
              <CardHeader>
                <CardTitle>Magic Link</CardTitle>
                <CardDescription>
                  We'll send you a secure link to sign in
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-magic">Email</Label>
                    <Input
                      id="email-magic"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {message && (
                    <div className={`text-sm ${message.includes('error') || message.includes('Failed') ? 'text-red-300' : 'text-green-300'}`}>
                      {message}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-slate-400">
          Demo credentials: <br />
          Email: <code>demo@example.com</code> <br />
          Password: <code>demo123</code>
        </div>
      </div>
    </div>
  )
}
