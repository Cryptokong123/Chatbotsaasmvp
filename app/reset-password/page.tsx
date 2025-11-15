'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()
  const { toast} = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      toast({
        title: 'Success',
        description: 'Your password has been updated!',
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Password reset links expire after 1 hour for security reasons.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/forgot-password')} className="w-full">
                Request new reset link
              </Button>
              <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
                Return to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {!success && (
            <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
          )}
          <CardTitle className="text-2xl font-bold">
            {success ? 'Password Updated!' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {success
              ? 'Your password has been successfully updated.'
              : 'Enter your new password below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">All set!</p>
                    <p className="text-sm text-green-800">
                      Your password has been updated successfully. Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  minLength={6}
                />
                <p className="text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">Passwords do not match</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
