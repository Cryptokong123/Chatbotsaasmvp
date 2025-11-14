'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export default function EmbedCodePage() {
  const params = useParams()
  const botId = params.id as string
  const [bot, setBot] = useState<any>(null)
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
    fetchBot()
  }, [botId])

  const fetchBot = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single()

      if (error) throw error
      setBot(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bot',
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
    </div>
  )
}
