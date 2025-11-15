'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Copy, Check, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import type { Plan } from '@/lib/plans'

export default function EmbedCodePage() {
  const params = useParams()
  const botId = params.id as string
  const [bot, setBot] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<Plan | null>(null)
  const [canEmbed, setCanEmbed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const embedCode = `<script
  src="${appUrl}/widget.js"
  data-bot-id="${botId}">
</script>`

  useEffect(() => {
    fetchBotAndUser()
  }, [botId])

  const fetchBotAndUser = async () => {
    try {
      // Fetch bot
      const { data: botData, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single()

      if (botError) throw botError
      setBot(botData)

      // Fetch user's plan
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (!userError && userData) {
          const plan = (userData.plan || 'demo') as Plan
          setUserPlan(plan)

          // Check if user can embed (demo cannot embed)
          setCanEmbed(plan !== 'demo')
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      })
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Embed code copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!bot) return null

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/bots/${botId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bot Settings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Embed {bot.name}</h1>
        <p className="text-gray-600 mt-1">Add this chatbot to your website</p>
      </div>

      {!canEmbed ? (
        // 🔒 UPGRADE GATE - Demo users can't embed
        <Card className="border-2 border-primary">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Upgrade to Publish Your Bot</CardTitle>
            <CardDescription className="text-base mt-2">
              You're currently on the <strong>Demo</strong> plan. Upgrade to embed your bot on your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="font-semibold mb-3">What you get with a paid plan:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Embed chatbot on unlimited websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Full API access for custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Remove ChatForge branding (white-label)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority email support</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Demo mode</strong> lets you build and test your bot for free. When you're ready to deploy
                it to your website, simply upgrade to a paid plan!
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button
                size="lg"
                onClick={() => router.push('/pricing')}
              >
                View Pricing Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // ✅ User has paid plan - show embed code
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>
                Copy the code below and paste it into your website&apos;s HTML, just before the closing
                &lt;/body&gt; tag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={handleCopy}
                    variant={copied ? 'secondary' : 'default'}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Implementation Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Copy the embed code above</li>
                    <li>Open your website&apos;s HTML file</li>
                    <li>Paste the code just before the closing &lt;/body&gt; tag</li>
                    <li>Save and reload your website</li>
                    <li>The chatbot widget will appear in the bottom-right corner</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Your Bot</CardTitle>
              <CardDescription>Preview how your bot will look on your website</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">
                  The widget will appear as a floating button on the bottom-right of your pages
                </p>
                <div className="inline-block bg-white rounded-lg shadow-lg p-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: bot.primary_color }}
                  >
                    💬
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
