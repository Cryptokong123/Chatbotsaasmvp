'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export default function BotDetailPage() {
  const params = useParams()
  const botId = params.id as string
  const [bot, setBot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('bots')
        .update({
          name: bot.name,
          description: bot.description,
          instructions: bot.instructions,
          welcome_message: bot.welcome_message,
          placeholder_text: bot.placeholder_text,
          primary_color: bot.primary_color,
          is_active: bot.is_active,
          tone: bot.tone,
          formality: bot.formality,
          use_emojis: bot.use_emojis,
          response_length: bot.response_length,
          creativity_level: bot.creativity_level,
        })
        .eq('id', botId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Bot updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bot',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bots
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{bot.name}</h1>
        <p className="text-gray-600 mt-1">Edit bot configuration</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure your bot's core settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name</Label>
                  <Input
                    id="name"
                    value={bot.name}
                    onChange={(e) => setBot({ ...bot, name: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={bot.description || ''}
                    onChange={(e) => setBot({ ...bot, description: e.target.value })}
                    disabled={saving}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">System Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={bot.instructions}
                    onChange={(e) => setBot({ ...bot, instructions: e.target.value })}
                    disabled={saving}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Input
                    id="welcomeMessage"
                    value={bot.welcome_message}
                    onChange={(e) => setBot({ ...bot, welcome_message: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeholderText">Input Placeholder</Label>
                  <Input
                    id="placeholderText"
                    value={bot.placeholder_text}
                    onChange={(e) => setBot({ ...bot, placeholder_text: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="color"
                      value={bot.primary_color}
                      onChange={(e) => setBot({ ...bot, primary_color: e.target.value })}
                      disabled={saving}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={bot.primary_color}
                      onChange={(e) => setBot({ ...bot, primary_color: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={bot.is_active}
                    onChange={(e) => setBot({ ...bot, is_active: e.target.checked })}
                    disabled={saving}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Bot is active
                  </Label>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality Settings</CardTitle>
            <CardDescription>Customize how your bot communicates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={bot.tone || 'professional'}
                    onValueChange={(value) => setBot({ ...bot, tone: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Overall tone and style of communication</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formality">Formality Level</Label>
                  <Select
                    value={bot.formality || 'balanced'}
                    onValueChange={(value) => setBot({ ...bot, formality: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_formal">Very Formal</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="very_casual">Very Casual</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">How formal the language should be</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseLength">Response Length</Label>
                  <Select
                    value={bot.response_length || 'balanced'}
                    onValueChange={(value) => setBot({ ...bot, response_length: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise (1-2 sentences)</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Preferred length of responses</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creativityLevel">Creativity Level: {bot.creativity_level || 0.7}</Label>
                  <input
                    type="range"
                    id="creativityLevel"
                    min="0"
                    max="1"
                    step="0.1"
                    value={bot.creativity_level || 0.7}
                    onChange={(e) => setBot({ ...bot, creativity_level: parseFloat(e.target.value) })}
                    disabled={saving}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Factual & Precise</span>
                    <span>Creative & Varied</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useEmojis"
                    checked={bot.use_emojis || false}
                    onChange={(e) => setBot({ ...bot, use_emojis: e.target.checked })}
                    disabled={saving}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="useEmojis" className="cursor-pointer">
                    Use emojis in responses
                  </Label>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Personality Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your bot features and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/analytics`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">📊</span>
                <span className="text-sm">Analytics</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/insights`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">💡</span>
                <span className="text-sm">Insights & AI Suggestions</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/monitor`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">👁️</span>
                <span className="text-sm">Live Monitor</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/presets`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">⚡</span>
                <span className="text-sm">Presets</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/actions`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🔗</span>
                <span className="text-sm">Actions</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/test`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🧪</span>
                <span className="text-sm">Test Bot</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/bots/${botId}/embed`)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">📦</span>
                <span className="text-sm">Embed Code</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open(`/api/conversations/export?botId=${botId}&format=json`, '_blank')}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">⬇️</span>
                <span className="text-sm">Export Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
