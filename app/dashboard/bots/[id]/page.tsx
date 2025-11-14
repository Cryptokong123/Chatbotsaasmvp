'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/bots/${botId}/embed`)}
                >
                  Get Embed Code
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
