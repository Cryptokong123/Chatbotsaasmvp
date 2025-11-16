'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

export default function NewAgentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: 'You are a helpful AI assistant that provides accurate and friendly support to users.',
    personality: 'professional',
    response_style: 'balanced',
    enable_sentiment_analysis: false,
    enable_multi_language: false,
    enable_handoff_to_human: false,
    enable_analytics: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }

      toast({
        title: 'Success',
        description: 'Agent created successfully!',
      })

      router.push(`/dashboard/agents/${data.agent.id}`)
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

  const agentTemplates = [
    {
      name: 'Customer Support Agent',
      description: 'Helps customers with product questions and issues',
      instructions: 'You are a helpful customer support agent. Provide clear, empathetic responses to customer inquiries. If you cannot solve an issue, offer to escalate to a human agent.',
      personality: 'friendly',
      response_style: 'balanced',
    },
    {
      name: 'Sales Assistant',
      description: 'Qualifies leads and answers product questions',
      instructions: 'You are a sales assistant helping potential customers learn about our products. Ask qualifying questions, understand their needs, and recommend appropriate solutions.',
      personality: 'enthusiastic',
      response_style: 'detailed',
    },
    {
      name: 'FAQ Bot',
      description: 'Answers frequently asked questions',
      instructions: 'You are an FAQ assistant that provides quick, accurate answers to common questions. Keep responses concise and to the point.',
      personality: 'professional',
      response_style: 'concise',
    },
    {
      name: 'Appointment Scheduler',
      description: 'Helps users book appointments',
      instructions: 'You are an appointment scheduling assistant. Help users find available time slots and book appointments. Always confirm details before finalizing.',
      personality: 'friendly',
      response_style: 'balanced',
    },
  ]

  const applyTemplate = (template: typeof agentTemplates[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      instructions: template.instructions,
      personality: template.personality,
      response_style: template.response_style,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground mt-1">
            Set up your AI agent and connect it to messaging platforms
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Configure your agent's personality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Customer Support Agent"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this agent do?"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">System Instructions *</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Define the agent's role and behavior..."
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      These instructions guide how the agent responds to users
                    </p>
                  </div>
                </div>

                {/* Personality & Style */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality</Label>
                    <Select
                      value={formData.personality}
                      onValueChange={(value) => setFormData({ ...formData, personality: value })}
                    >
                      <SelectTrigger id="personality">
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
                    <Label htmlFor="response_style">Response Style</Label>
                    <Select
                      value={formData.response_style}
                      onValueChange={(value) => setFormData({ ...formData, response_style: value })}
                    >
                      <SelectTrigger id="response_style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Features */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Advanced Features</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sentiment">Sentiment Analysis</Label>
                      <p className="text-xs text-muted-foreground">
                        Detect user emotions and sentiment
                      </p>
                    </div>
                    <Switch
                      id="sentiment"
                      checked={formData.enable_sentiment_analysis}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_sentiment_analysis: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="multilang">Multi-Language Support</Label>
                      <p className="text-xs text-muted-foreground">
                        Auto-detect and respond in user's language
                      </p>
                    </div>
                    <Switch
                      id="multilang"
                      checked={formData.enable_multi_language}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_multi_language: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="handoff">Handoff to Human</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow escalation to human agents
                      </p>
                    </div>
                    <Switch
                      id="handoff"
                      checked={formData.enable_handoff_to_human}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_handoff_to_human: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics">Analytics</Label>
                      <p className="text-xs text-muted-foreground">
                        Track conversations and performance
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={formData.enable_analytics}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_analytics: checked })
                      }
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Agent'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Templates
              </CardTitle>
              <CardDescription>
                Start with a pre-configured template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>After creating your agent, you'll be able to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Connect messaging platforms</li>
                <li>Train with your knowledge base</li>
                <li>Test conversations</li>
                <li>Deploy to production</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
