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
  const [placeholderText, setPlaceholderText] = useState('Type your message...')
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
          placeholder_text: placeholderText,
          primary_color: primaryColor,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Chatbot created successfully! You can now train it with your data.',
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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 dark:hover:bg-white/10 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Chatbot</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create a simple chatbot that you can train with your own data. Configure its appearance and behavior below.
        </p>
      </div>

      {/* Bot Configuration Form */}
      <Card className="dark:bg-white/5 dark:border-white/10">
        <CardHeader>
          <CardTitle className="dark:text-white">Chatbot Configuration</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Set up your chatbot's basic information and customize how it appears to your users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-300">Bot Name*</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this bot do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions" className="dark:text-gray-300">System Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Instructions for the AI..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={loading}
                  rows={4}
                  className="dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Define how your bot should behave and respond to users
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage" className="dark:text-gray-300">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  placeholder="Hi! How can I help you today?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  disabled={loading}
                  className="dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholderText" className="dark:text-gray-300">Input Placeholder</Label>
                <Input
                  id="placeholderText"
                  placeholder="Type your message..."
                  value={placeholderText}
                  onChange={(e) => setPlaceholderText(e.target.value)}
                  disabled={loading}
                  className="dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="dark:text-gray-300">Primary Color</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={loading}
                    className="w-20 h-10 dark:bg-white/10 dark:border-white/20"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={loading}
                    placeholder="#6C47FF"
                    className="flex-1 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This color will be used for the chatbot widget on your website
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()} className="bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black">
                {loading ? 'Creating...' : 'Create Chatbot'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
