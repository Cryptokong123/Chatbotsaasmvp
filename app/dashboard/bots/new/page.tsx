'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export default function NewBotPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('You are a helpful assistant. Answer questions based on the provided context.')
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?')
  const [primaryColor, setPrimaryColor] = useState('#6C47FF')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('bots')
        .insert({
          user_id: user.id,
          name,
          description,
          instructions,
          welcome_message: welcomeMessage,
          primary_color: primaryColor,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Bot created successfully',
      })

      router.push(`/dashboard/bots/${data.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Bot</h1>
        <p className="text-gray-600 mt-1">Set up your AI chatbot</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>
            Configure your bot's behavior and appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name*</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this bot do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Instructions for the AI..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={loading}
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Define how your bot should behave and respond to users
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  placeholder="Hi! How can I help you today?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={loading}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={loading}
                    placeholder="#6C47FF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Bot'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
