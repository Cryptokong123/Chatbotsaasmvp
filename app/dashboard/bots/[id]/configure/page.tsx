'use client'

/**
 * Bot Configuration Page with Live Preview
 *
 * Split-screen view: configuration on left, live preview on right
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Eye, EyeOff, BookTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { BotPreviewWidget } from '@/components/bot-preview-widget'

export default function BotConfigurePage() {
  const params = useParams()
  const botId = params.id as string
  const [bot, setBot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const router = useRouter()
  const { toast} = useToast()
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

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault()
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
          avatar_url: bot.avatar_url,
          is_active: bot.is_active,
          tone: bot.tone,
          formality: bot.formality,
          use_emojis: bot.use_emojis,
          response_length: bot.response_length,
          creativity_level: bot.creativity_level,
        })
        .eq('id', botId)

      if (error) throw error

      setLastSaved(new Date())
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

  const handleSaveAsTemplate = async () => {
    setSavingTemplate(true)

    try {
      const response = await fetch(`/api/bots/${botId}/save-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          templateDescription,
          category: 'custom',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template')
      }

      toast({
        title: 'Success',
        description: `Template "${templateName}" created successfully`,
      })

      setShowTemplateDialog(false)
      setTemplateName('')
      setTemplateDescription('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template',
        variant: 'destructive',
      })
    } finally {
      setSavingTemplate(false)
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
    <div className="h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/bots/${botId}`)}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{bot.name}</h1>
              <p className="text-sm text-muted-foreground">
                Configure your bot's appearance and behavior
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplateName(bot.name + ' Template')
                setTemplateDescription(bot.description || '')
                setShowTemplateDialog(true)
              }}
            >
              <BookTemplate className="h-4 w-4 mr-2" />
              Save as Template
            </Button>

            <Button onClick={handleUpdate} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Configuration Panel */}
        <div
          className={`overflow-y-auto p-6 transition-all ${
            showPreview ? 'w-2/3' : 'w-full'
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            <Tabs defaultValue="appearance">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visual Settings</CardTitle>
                    <CardDescription>
                      Customize how your bot appears to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Bot Name</Label>
                      <Input
                        id="name"
                        value={bot.name}
                        onChange={(e) => setBot({ ...bot, name: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        This appears in the chat widget header
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          id="primary-color"
                          value={bot.primary_color}
                          onChange={(e) =>
                            setBot({ ...bot, primary_color: e.target.value })
                          }
                          className="w-20 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={bot.primary_color}
                          onChange={(e) =>
                            setBot({ ...bot, primary_color: e.target.value })
                          }
                          placeholder="#6C47FF"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
                      <Input
                        id="avatar-url"
                        value={bot.avatar_url || ''}
                        onChange={(e) =>
                          setBot({ ...bot, avatar_url: e.target.value })
                        }
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>
                      Configure default messages and text
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome-message">Welcome Message</Label>
                      <Textarea
                        id="welcome-message"
                        value={bot.welcome_message}
                        onChange={(e) =>
                          setBot({ ...bot, welcome_message: e.target.value })
                        }
                        rows={2}
                        placeholder="Hi! How can I help you today?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeholder">Input Placeholder</Label>
                      <Input
                        id="placeholder"
                        value={bot.placeholder_text}
                        onChange={(e) =>
                          setBot({ ...bot, placeholder_text: e.target.value })
                        }
                        placeholder="Type your message..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Behavior Tab */}
              <TabsContent value="behavior" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personality</CardTitle>
                    <CardDescription>
                      Define how your bot communicates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Select
                        value={bot.tone}
                        onValueChange={(value) => setBot({ ...bot, tone: value })}
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="formality">Formality Level</Label>
                      <Select
                        value={bot.formality}
                        onValueChange={(value) =>
                          setBot({ ...bot, formality: value })
                        }
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="response-length">Response Length</Label>
                      <Select
                        value={bot.response_length}
                        onValueChange={(value) =>
                          setBot({ ...bot, response_length: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Use Emojis</Label>
                        <p className="text-xs text-muted-foreground">
                          Include emojis in responses
                        </p>
                      </div>
                      <Switch
                        checked={bot.use_emojis}
                        onCheckedChange={(checked) =>
                          setBot({ ...bot, use_emojis: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>
                      Advanced AI behavior settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructions">System Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={bot.instructions}
                        onChange={(e) =>
                          setBot({ ...bot, instructions: e.target.value })
                        }
                        rows={5}
                        placeholder="You are a helpful assistant..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Core instructions that guide the AI's behavior
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="creativity">
                          Creativity Level: {bot.creativity_level}
                        </Label>
                      </div>
                      <input
                        type="range"
                        id="creativity"
                        min="0"
                        max="1"
                        step="0.1"
                        value={bot.creativity_level}
                        onChange={(e) =>
                          setBot({
                            ...bot,
                            creativity_level: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="space-y-0.5">
                        <Label>Bot Active</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable or disable this bot
                        </p>
                      </div>
                      <Switch
                        checked={bot.is_active}
                        onCheckedChange={(checked) =>
                          setBot({ ...bot, is_active: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {lastSaved && (
              <p className="text-xs text-muted-foreground text-center">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="w-1/3 border-l bg-gray-50 p-6 overflow-y-auto">
            <div className="sticky top-0 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Live Preview</h2>
                <p className="text-sm text-muted-foreground">
                  See changes in real-time
                </p>
              </div>

              <div className="flex justify-center">
                <BotPreviewWidget
                  botConfig={{
                    name: bot.name,
                    welcome_message: bot.welcome_message,
                    placeholder_text: bot.placeholder_text,
                    primary_color: bot.primary_color,
                    avatar_url: bot.avatar_url,
                  }}
                  showControls={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this bot's configuration as a reusable template. You can use it to quickly create new bots with the same settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name*</Label>
              <Input
                id="template-name"
                placeholder="e.g., Customer Support Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this template is for..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              disabled={savingTemplate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={savingTemplate || !templateName.trim()}
            >
              {savingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
