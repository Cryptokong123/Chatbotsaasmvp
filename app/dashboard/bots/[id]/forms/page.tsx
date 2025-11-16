'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { PreChatFormBuilder, type PreChatForm } from '@/components/pre-chat-form-builder'
import { PreChatFormRenderer } from '@/components/pre-chat-form-renderer'

export default function BotFormsPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()

  const [forms, setForms] = useState<PreChatForm[]>([])
  const [loading, setLoading] = useState(true)
  const [editingForm, setEditingForm] = useState<PreChatForm | null>(null)
  const [previewForm, setPreviewForm] = useState<PreChatForm | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [botId])

  const fetchForms = async () => {
    try {
      const { data: formsData, error: formsError } = await supabase
        .from('pre_chat_forms')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false })

      if (formsError) throw formsError

      // Fetch fields for each form
      const formsWithFields = await Promise.all(
        (formsData || []).map(async (form) => {
          const { data: fieldsData } = await supabase
            .from('pre_chat_form_fields')
            .select('*')
            .eq('form_id', form.id)
            .order('order_index')

          return {
            ...form,
            fields: fieldsData || [],
          }
        })
      )

      setForms(formsWithFields)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch forms',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveForm = async (form: PreChatForm) => {
    try {
      if (form.id) {
        // Update existing form
        const { error: formError } = await supabase
          .from('pre_chat_forms')
          .update({
            name: form.name,
            description: form.description,
            is_active: form.is_active,
            show_on_load: form.show_on_load,
            required_to_chat: form.required_to_chat,
            submit_button_text: form.submit_button_text,
            welcome_text: form.welcome_text,
          })
          .eq('id', form.id)

        if (formError) throw formError

        // Delete existing fields and insert new ones
        await supabase
          .from('pre_chat_form_fields')
          .delete()
          .eq('form_id', form.id)

        if (form.fields.length > 0) {
          const { error: fieldsError } = await supabase
            .from('pre_chat_form_fields')
            .insert(
              form.fields.map((field) => ({
                form_id: form.id,
                field_name: field.field_name,
                field_label: field.field_label,
                field_type: field.field_type,
                placeholder: field.placeholder,
                default_value: field.default_value,
                is_required: field.is_required,
                validation_rules: field.validation_rules,
                options: field.options,
                conditional_logic: field.conditional_logic,
                order_index: field.order_index,
                help_text: field.help_text,
              }))
            )

          if (fieldsError) throw fieldsError
        }

        toast({
          title: 'Success',
          description: 'Form updated successfully',
        })
      } else {
        // Create new form
        const { data: newForm, error: formError } = await supabase
          .from('pre_chat_forms')
          .insert({
            bot_id: botId,
            name: form.name,
            description: form.description,
            is_active: form.is_active,
            show_on_load: form.show_on_load,
            required_to_chat: form.required_to_chat,
            submit_button_text: form.submit_button_text,
            welcome_text: form.welcome_text,
          })
          .select()
          .single()

        if (formError) throw formError

        if (form.fields.length > 0) {
          const { error: fieldsError } = await supabase
            .from('pre_chat_form_fields')
            .insert(
              form.fields.map((field) => ({
                form_id: newForm.id,
                field_name: field.field_name,
                field_label: field.field_label,
                field_type: field.field_type,
                placeholder: field.placeholder,
                default_value: field.default_value,
                is_required: field.is_required,
                validation_rules: field.validation_rules,
                options: field.options,
                conditional_logic: field.conditional_logic,
                order_index: field.order_index,
                help_text: field.help_text,
              }))
            )

          if (fieldsError) throw fieldsError
        }

        toast({
          title: 'Success',
          description: 'Form created successfully',
        })
      }

      setShowBuilder(false)
      setEditingForm(null)
      fetchForms()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save form',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const { error } = await supabase
        .from('pre_chat_forms')
        .delete()
        .eq('id', formId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Form deleted successfully',
      })

      fetchForms()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete form',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicateForm = async (form: PreChatForm) => {
    const duplicatedForm: PreChatForm = {
      ...form,
      id: undefined,
      name: `${form.name} (Copy)`,
      is_active: false,
    }

    setEditingForm(duplicatedForm)
    setShowBuilder(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pre-Chat Forms</h1>
          <p className="text-gray-600 mt-1">
            Collect information from users before they start chatting
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingForm(null)
            setShowBuilder(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              No pre-chat forms created yet.
              <br />
              Create a form to collect user information before chatting.
            </p>
            <Button
              onClick={() => {
                setEditingForm(null)
                setShowBuilder(true)
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {form.name}
                      {form.is_active && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    {form.description && (
                      <CardDescription className="mt-1">
                        {form.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• {form.fields.length} field(s)</p>
                  {form.show_on_load && <p>• Shows on widget load</p>}
                  {form.required_to_chat && <p>• Required to chat</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewForm(form)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingForm(form)
                      setShowBuilder(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateForm(form)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteForm(form.id!)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingForm?.id ? 'Edit Form' : 'Create Form'}
            </DialogTitle>
          </DialogHeader>
          <PreChatFormBuilder
            initialForm={editingForm || undefined}
            onSave={handleSaveForm}
            onPreview={(form) => {
              setPreviewForm(form)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          {previewForm && (
            <PreChatFormRenderer
              form={previewForm}
              onSubmit={(data) => {
                console.log('Preview form data:', data)
                toast({
                  title: 'Preview Mode',
                  description: 'Form data logged to console',
                })
              }}
              onSkip={() => {
                toast({
                  title: 'Preview Mode',
                  description: 'Skip button clicked',
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
