'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSent(true)
      toast({
        title: 'Success',
        description: 'Password reset email sent! Check your inbox.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
          <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
          <CardDescription>
            {sent
              ? "We've sent you a password reset link!"
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Check your email</p>
                    <p className="text-sm text-green-800">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      The link will expire in 1 hour. Didn't receive the email? Check your spam folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Try a different email
                </Button>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Return to login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
