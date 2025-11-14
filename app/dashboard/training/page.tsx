'use client'

import { useEffect, useState } from 'react'
import { Plus, Upload, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime, truncate } from '@/lib/utils'

interface Bot {
  id: string
  name: string
}

interface TrainingData {
  id: string
  content: string
  source_type: string
  source_name: string | null
  created_at: string
  bot_id: string
}

export default function TrainingDataPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [content, setContent] = useState('')
  const [sourceName, setSourceName] = useState('')
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchBots()
  }, [])

  useEffect(() => {
    if (selectedBot) {
      fetchTrainingData()
    }
  }, [selectedBot])

  const fetchBots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bots')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBots(data || [])
      if (data && data.length > 0) {
        setSelectedBot(data[0].id)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bots',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainingData = async () => {
    if (!selectedBot) return

    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('bot_id', selectedBot)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrainingData(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch training data',
        variant: 'destructive',
      })
    }
  }

  const handleUpload = async () => {
    if (!content.trim() || !selectedBot) {
      toast({
        title: 'Error',
        description: 'Please select a bot and enter content',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const response = await fetch('/api/training/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBot,
          content,
          sourceType: 'text',
          sourceName: sourceName || 'Manual Upload',
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Upload failed')

      toast({
        title: 'Success',
        description: 'Training data uploaded successfully',
      })

      setContent('')
      setSourceName('')
      fetchTrainingData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload training data',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training data?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Training data deleted',
      })

      fetchTrainingData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete training data',
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

  if (bots.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bots found</h3>
          <p className="text-gray-600 mb-6">Create a bot first to add training data</p>
          <Button onClick={() => (window.location.href = '/dashboard/bots/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Training Data</h1>
        <p className="text-gray-600 mt-1">Upload content to train your chatbots</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Add Training Data</CardTitle>
            <CardDescription>Upload text content for your bot to learn from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot">Select Bot</Label>
              <select
                id="bot"
                value={selectedBot}
                onChange={(e) => setSelectedBot(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name (Optional)</Label>
              <Input
                id="sourceName"
                placeholder="e.g., Product Documentation"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={uploading}
                rows={10}
              />
              <p className="text-sm text-gray-500">
                Tip: Paste FAQs, documentation, or any text you want your bot to learn from
              </p>
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Training Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Training Data List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Training Data</CardTitle>
            <CardDescription>
              {trainingData.length} item{trainingData.length !== 1 ? 's' : ''} for selected bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trainingData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No training data yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {trainingData.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {item.source_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(item.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">
                      {truncate(item.content, 150)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
