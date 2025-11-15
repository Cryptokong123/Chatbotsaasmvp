'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Zap, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface PresetResponse {
  id: string
  bot_id: string
  question: string
  answer: string
  match_type: 'exact' | 'contains' | 'starts_with'
  priority: number
  is_active: boolean
  created_at: string
}

export default function PresetResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const botId = params.id as string

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PresetResponse | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    matchType: 'exact' as 'exact' | 'contains' | 'starts_with',
    priority: 0,
  })

  // Fetch presets
  const { data, isLoading } = useQuery({
    queryKey: ['preset-responses', botId],
    queryFn: async () => {
      const res = await fetch(`/api/preset-responses?botId=${botId}`)
      if (!res.ok) throw new Error('Failed to fetch presets')
      return res.json()
    },
  })

  // Create preset mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/preset-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          question: data.question,
          answer: data.answer,
          matchType: data.matchType,
          priority: data.priority,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create preset')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preset-responses', botId] })
      toast.success('Preset response created!')
      resetForm()
      setIsDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update preset mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/preset-responses?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update preset')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preset-responses', botId] })
      toast.success('Preset response updated!')
      resetForm()
      setIsDialogOpen(false)
    },
    onError: () => {
      toast.error('Failed to update preset response')
    },
  })

  // Delete preset mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/preset-responses?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete preset')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preset-responses', botId] })
      toast.success('Preset response deleted!')
    },
    onError: () => {
      toast.error('Failed to delete preset response')
    },
  })

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      matchType: 'exact',
      priority: 0,
    })
    setEditingPreset(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPreset) {
      updateMutation.mutate({
        id: editingPreset.id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (preset: PresetResponse) => {
    setEditingPreset(preset)
    setFormData({
      question: preset.question,
      answer: preset.answer,
      matchType: preset.match_type,
      priority: preset.priority,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this preset response?')) {
      deleteMutation.mutate(id)
    }
  }

  const presets = data?.presets || []

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back to Bot
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Preset Responses</h1>
            <p className="text-muted-foreground mt-2">
              Save AI costs by setting up instant responses for common questions
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Preset
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <Zap className="h-4 w-4" />
        <AlertTitle>Cost Savings</AlertTitle>
        <AlertDescription>
          Preset responses are checked BEFORE calling AI, saving you API costs and providing instant
          answers. Perfect for FAQs and common questions.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-8">Loading presets...</div>
      ) : presets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No preset responses yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first preset to provide instant answers
            </p>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Preset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {presets.map((preset: PresetResponse) => (
            <Card key={preset.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{preset.question}</CardTitle>
                    <CardDescription className="mt-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {preset.match_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs">Priority: {preset.priority}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(preset)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{preset.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? 'Edit Preset Response' : 'Add Preset Response'}
            </DialogTitle>
            <DialogDescription>
              Set up an instant response that bypasses AI processing
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question / Trigger</Label>
                <Input
                  id="question"
                  placeholder="What are your business hours?"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The user's question that will trigger this response
                </p>
              </div>

              <div>
                <Label htmlFor="answer">Response</Label>
                <Textarea
                  id="answer"
                  placeholder="We're open Monday-Friday, 9 AM - 6 PM EST."
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The instant response that will be sent
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matchType">Match Type</Label>
                  <Select
                    value={formData.matchType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, matchType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">Exact Match</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How strictly to match the question
                  </p>
                </div>

                <div>
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher priority = checked first
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingPreset
                    ? 'Update Preset'
                    : 'Create Preset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
