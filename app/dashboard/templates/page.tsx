'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Sparkles, TrendingUp, Filter, Search, Eye, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface BotTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  primary_color: string
  display_name: string
  system_prompt: string
  welcome_message: string
  use_count: number
  is_featured: boolean
  preview_conversation: any[]
  tags: string[]
  presets?: any[]
  actions?: any[]
}

const categories = [
  { value: 'all', label: 'All Templates', icon: '🌐' },
  { value: 'customer_support', label: 'Customer Support', icon: '🎧' },
  { value: 'sales', label: 'Sales', icon: '💼' },
  { value: 'faq', label: 'FAQ', icon: '📚' },
  { value: 'lead_generation', label: 'Lead Generation', icon: '🎯' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
  { value: 'education', label: 'Education', icon: '📖' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'hr', label: 'HR & Recruiting', icon: '👥' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'general', label: 'General', icon: '🤖' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<BotTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<BotTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<BotTemplate | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchQuery, selectedCategory])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates?category=${selectedCategory}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates || [])
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

  const filterTemplates = () => {
    let filtered = templates

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    setFilteredTemplates(filtered)
  }

  const handleCreateFromTemplate = async (templateId: string, templateName: string) => {
    const customName = prompt(`Name your bot (default: ${templateName}):`, templateName)

    if (customName === null) return // User cancelled

    setCreating(templateId)

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          customName: customName || templateName,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: `Bot "${customName || templateName}" created successfully! Copied ${data.copied.presets} presets and ${data.copied.actions} actions.`,
      })

      // Navigate to the new bot
      router.push(`/dashboard/bots/${data.bot.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot from template',
        variant: 'destructive',
      })
    } finally {
      setCreating(null)
    }
  }

  const getCategoryLabel = (value: string) => {
    return categories.find((c) => c.value === value)?.label || value
  }

  const getCategoryIcon = (value: string) => {
    return categories.find((c) => c.value === value)?.icon || '🤖'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bot Templates</h1>
          <p className="text-gray-600">Choose from pre-built templates to get started quickly</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Bot Templates</h1>
        </div>
        <p className="text-gray-600">
          Choose from pre-built templates to create your bot in seconds
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 text-gray-500 shrink-0" />
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="shrink-0"
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Templates Banner */}
      {selectedCategory === 'all' && (
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Featured Templates</h2>
          </div>
          <p className="text-gray-700">
            Most popular templates used by thousands of businesses to improve customer engagement
          </p>
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow relative overflow-hidden"
            >
              {template.is_featured && (
                <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  ⭐ FEATURED
                </div>
              )}

              <CardHeader>
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: template.primary_color + '20' }}
                >
                  {template.icon}
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Category & Use Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                      <span>{getCategoryIcon(template.category)}</span>
                      {getCategoryLabel(template.category)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      {template.use_count.toLocaleString()} uses
                    </span>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template.id, template.name)}
                      disabled={creating === template.id}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {creating === template.id ? 'Creating...' : 'Use Template'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                    style={{ backgroundColor: previewTemplate.primary_color + '20' }}
                  >
                    {previewTemplate.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{previewTemplate.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCategoryLabel(previewTemplate.category)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{previewTemplate.description}</p>
              </div>

              {/* Preview Conversation */}
              {previewTemplate.preview_conversation &&
                previewTemplate.preview_conversation.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Preview Conversation</h3>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {previewTemplate.preview_conversation.map((message: any, index: number) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Instructions */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instructions</h3>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {previewTemplate.system_prompt}
                </div>
              </div>

              {/* Welcome Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Welcome Message</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                  {previewTemplate.welcome_message}
                </div>
              </div>

              {/* Included Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What's Included</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {previewTemplate.presets?.length || 0} preset responses
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {previewTemplate.actions?.length || 0} actions/webhooks
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Custom branding
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Ready to customize
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={() => {
                  setPreviewTemplate(null)
                  handleCreateFromTemplate(previewTemplate.id, previewTemplate.name)
                }}
                className="w-full"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Bot from Template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
