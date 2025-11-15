'use client'

import { useEffect, useState } from 'react'
import { Plus, Zap, Edit2, Trash2, Copy, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserSupabaseClient } from '@/lib/supabase'

interface QuickReply {
  id: string
  title: string
  message: string
  shortcut: string | null
  category: string
  bot_id: string | null
  is_global: boolean
  use_count: number
  is_active: boolean
  created_at: string
}

interface Bot {
  id: string
  name: string
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'greeting', label: 'Greetings' },
  { value: 'closing', label: 'Closings' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'apology', label: 'Apologies' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'general', label: 'General' },
]

export default function QuickRepliesPage() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [replyToDelete, setReplyToDelete] = useState<QuickReply | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [category, setCategory] = useState('general')
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchBots()
    fetchQuickReplies()
  }, [selectedCategory])

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
      if (data && data.length > 0 && !selectedBot) {
        setSelectedBot(data[0].id)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bots',
        variant: 'destructive',
      })
    }
  }

  const fetchQuickReplies = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/quick-replies?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quick replies')
      }

      setQuickReplies(data.quickReplies || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        title,
        message,
        shortcut: shortcut || null,
        category,
        botId: isGlobal ? null : selectedBot,
        isGlobal,
      }

      let response
      if (editingReply) {
        response = await fetch('/api/quick-replies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quickReplyId: editingReply.id, ...payload }),
        })
      } else {
        response = await fetch('/api/quick-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: `Quick reply ${editingReply ? 'updated' : 'created'} successfully`,
      })

      resetForm()
      fetchQuickReplies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingReply ? 'update' : 'create'} quick reply`,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (reply: QuickReply) => {
    setEditingReply(reply)
    setTitle(reply.title)
    setMessage(reply.message)
    setShortcut(reply.shortcut || '')
    setCategory(reply.category)
    setIsGlobal(reply.is_global)
    if (reply.bot_id) {
      setSelectedBot(reply.bot_id)
    }
    setShowCreateDialog(true)
  }

  const handleDelete = async () => {
    if (!replyToDelete) return

    try {
      const response = await fetch(`/api/quick-replies?quickReplyId=${replyToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete quick reply')
      }

      toast({
        title: 'Success',
        description: 'Quick reply deleted successfully',
      })

      setDeleteConfirmOpen(false)
      setReplyToDelete(null)
      fetchQuickReplies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
    })
  }

  const resetForm = () => {
    setTitle('')
    setMessage('')
    setShortcut('')
    setCategory('general')
    setIsGlobal(false)
    setEditingReply(null)
    setShowCreateDialog(false)
  }

  const getCategoryColor = (cat: string) => {
    const colors: { [key: string]: string } = {
      greeting: 'bg-green-100 text-green-700',
      closing: 'bg-blue-100 text-blue-700',
      support: 'bg-purple-100 text-purple-700',
      sales: 'bg-pink-100 text-pink-700',
      technical: 'bg-orange-100 text-orange-700',
      billing: 'bg-yellow-100 text-yellow-700',
      apology: 'bg-red-100 text-red-700',
      thank_you: 'bg-teal-100 text-teal-700',
      follow_up: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700',
    }
    return colors[cat] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Replies</h1>
          <p className="text-gray-600">Manage your quick reply templates</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const filteredReplies = selectedCategory === 'all'
    ? quickReplies
    : quickReplies.filter(r => r.category === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Quick Replies</h1>
            </div>
            <p className="text-gray-600">
              Create and manage quick reply templates for faster responses
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quick Reply
          </Button>
        </div>

        {/* Category Filter */}
        <div className="w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Replies Grid */}
      {filteredReplies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quick replies yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first quick reply template to speed up your responses
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quick Reply
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReplies.map((reply) => (
            <Card key={reply.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{reply.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(reply.category)}`}>
                        {categories.find(c => c.value === reply.category)?.label}
                      </span>
                      {reply.is_global && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Global
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-3">{reply.message}</p>

                  {reply.shortcut && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                        {reply.shortcut}
                      </code>
                      <span className="text-xs">keyboard shortcut</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Used {reply.use_count} times</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(reply.message)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(reply)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyToDelete(reply)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingReply ? 'Edit' : 'Create'} Quick Reply</CardTitle>
              <CardDescription>
                {editingReply ? 'Update your' : 'Create a new'} quick reply template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Welcome Greeting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your quick reply message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">{message.length} characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shortcut">Shortcut (Optional)</Label>
                    <Input
                      id="shortcut"
                      placeholder="/hi"
                      value={shortcut}
                      onChange={(e) => setShortcut(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Must start with /</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.value !== 'all').map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="is-global" className="text-base font-medium cursor-pointer">
                      Available for all bots
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Make this quick reply available across all your bots
                    </p>
                  </div>
                  <Switch
                    id="is-global"
                    checked={isGlobal}
                    onCheckedChange={setIsGlobal}
                  />
                </div>

                {!isGlobal && bots.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="bot">Specific Bot</Label>
                    <Select value={selectedBot} onValueChange={setSelectedBot}>
                      <SelectTrigger id="bot">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bots.map((bot) => (
                          <SelectItem key={bot.id} value={bot.id}>
                            {bot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Saving...' : editingReply ? 'Update' : 'Create'} Quick Reply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quick Reply?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{replyToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
