'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookTemplate, Trash2, Edit, Plus, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UserTemplate {
  id: string
  name: string
  description: string
  category: string
  system_prompt: string
  welcome_message: string
  primary_color: string
  created_at: string
  use_count: number
}

export default function MyTemplatesPage() {
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<UserTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchUserTemplates()
  }, [])

  const fetchUserTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bot_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch templates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromTemplate = async (template: UserTemplate) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          customName: template.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: `Bot created from template "${template.name}"`,
      })

      router.push(`/dashboard/bots/${data.bot.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot from template',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTemplate = (template: UserTemplate) => {
    setTemplateToDelete(template)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('bot_templates')
        .delete()
        .eq('id', templateToDelete.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Template "${templateToDelete.name}" deleted`,
      })

      fetchUserTemplates()
      setDeleteConfirmOpen(false)
      setTemplateToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your custom bot templates</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookTemplate className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Templates</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your custom bot templates. Create templates from your bots to quickly build new ones with the same configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card className="text-center py-16 dark:bg-white/5 dark:border-white/10">
          <CardContent>
            <BookTemplate className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 dark:text-white">No templates yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven't created any templates yet. Go to any bot's configuration page and click "Save as Template" to create your first template.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} className="dark:bg-white/5 dark:border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: template.primary_color + '20' }}
                      >
                        <BookTemplate className="h-6 w-6" style={{ color: template.primary_color }} />
                      </div>
                      <div>
                        <CardTitle className="dark:text-white">{template.name}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created {new Date(template.created_at).toLocaleDateString()} • Used {template.use_count} times
                        </p>
                      </div>
                    </div>
                    <CardDescription className="dark:text-gray-400 mt-2">
                      {template.description || 'No description'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template)}
                      className="dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 dark:border-white/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Welcome Message</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.welcome_message}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">System Instructions</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.system_prompt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template "{templateToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Bots created from this template will not be affected.
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
