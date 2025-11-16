'use client'

/**
 * Pre-Chat Form Builder
 *
 * Allows users to create forms that collect information before starting a chat
 */

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Settings2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface FormField {
  id: string
  field_name: string
  field_label: string
  field_type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time'
  placeholder?: string
  default_value?: string
  is_required: boolean
  validation_rules?: Record<string, any>
  options?: Array<{ label: string; value: string }>
  conditional_logic?: {
    field: string
    operator: string
    value: string
  }
  order_index: number
  help_text?: string
}

export interface PreChatForm {
  id?: string
  name: string
  description?: string
  is_active: boolean
  show_on_load: boolean
  required_to_chat: boolean
  submit_button_text: string
  welcome_text?: string
  fields: FormField[]
}

interface PreChatFormBuilderProps {
  initialForm?: PreChatForm
  onSave: (form: PreChatForm) => Promise<void>
  onPreview?: (form: PreChatForm) => void
}

export function PreChatFormBuilder({
  initialForm,
  onSave,
  onPreview,
}: PreChatFormBuilderProps) {
  const [form, setForm] = useState<PreChatForm>(
    initialForm || {
      name: 'New Form',
      description: '',
      is_active: true,
      show_on_load: false,
      required_to_chat: false,
      submit_button_text: 'Start Chat',
      welcome_text: '',
      fields: [],
    }
  )
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [saving, setSaving] = useState(false)

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date Picker' },
    { value: 'time', label: 'Time Picker' },
  ]

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      field_name: `field_${form.fields.length + 1}`,
      field_label: 'New Field',
      field_type: 'text',
      placeholder: '',
      is_required: false,
      order_index: form.fields.length,
    }

    setForm({
      ...form,
      fields: [...form.fields, newField],
    })
    setSelectedField(newField)
  }

  const removeField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields.filter((f) => f.id !== fieldId),
    })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    })

    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const index = form.fields.findIndex((f) => f.id === fieldId)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === form.fields.length - 1)
    ) {
      return
    }

    const newFields = [...form.fields]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newFields[index], newFields[swapIndex]] = [
      newFields[swapIndex],
      newFields[index],
    ]

    // Update order_index
    newFields.forEach((field, idx) => {
      field.order_index = idx
    })

    setForm({ ...form, fields: newFields })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const [showLivePreview, setShowLivePreview] = useState(true)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">{form.name || 'Form Builder'}</h2>
          <p className="text-sm text-muted-foreground">
            Design your pre-chat form with live preview
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowLivePreview(!showLivePreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showLivePreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 flex-1 overflow-hidden ${showLivePreview ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* Form Settings */}
        <div className="space-y-4 overflow-y-auto pr-2">
        <Card>
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
            <CardDescription>
              Configure how and when this form appears
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Contact Information"
              />
            </div>

            <div>
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Internal description of this form"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="welcome-text">Welcome Text</Label>
              <Textarea
                id="welcome-text"
                value={form.welcome_text}
                onChange={(e) =>
                  setForm({ ...form, welcome_text: e.target.value })
                }
                placeholder="Text shown above the form (optional)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="submit-button">Submit Button Text</Label>
              <Input
                id="submit-button"
                value={form.submit_button_text}
                onChange={(e) =>
                  setForm({ ...form, submit_button_text: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Form Active</Label>
              <Switch
                id="is-active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-on-load">Show on Load</Label>
                <p className="text-xs text-muted-foreground">
                  Display immediately when widget opens
                </p>
              </div>
              <Switch
                id="show-on-load"
                checked={form.show_on_load}
                onCheckedChange={(checked) =>
                  setForm({ ...form, show_on_load: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required-to-chat">Required to Chat</Label>
                <p className="text-xs text-muted-foreground">
                  Users must complete form before chatting
                </p>
              </div>
              <Switch
                id="required-to-chat"
                checked={form.required_to_chat}
                onCheckedChange={(checked) =>
                  setForm({ ...form, required_to_chat: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected Field Editor */}
        {selectedField && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Field</CardTitle>
              <CardDescription>{selectedField.field_label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Field Label</Label>
                <Input
                  value={selectedField.field_label}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      field_label: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Field Name (internal)</Label>
                <Input
                  value={selectedField.field_name}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      field_name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                />
              </div>

              <div>
                <Label>Field Type</Label>
                <Select
                  value={selectedField.field_type}
                  onValueChange={(value: any) =>
                    updateField(selectedField.id, { field_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Placeholder</Label>
                <Input
                  value={selectedField.placeholder || ''}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      placeholder: e.target.value,
                    })
                  }
                  placeholder="e.g., Enter your email"
                />
              </div>

              <div>
                <Label>Help Text</Label>
                <Input
                  value={selectedField.help_text || ''}
                  onChange={(e) =>
                    updateField(selectedField.id, { help_text: e.target.value })
                  }
                  placeholder="Additional guidance for user"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Required Field</Label>
                <Switch
                  checked={selectedField.is_required}
                  onCheckedChange={(checked) =>
                    updateField(selectedField.id, { is_required: checked })
                  }
                />
              </div>

              {(selectedField.field_type === 'select' ||
                selectedField.field_type === 'radio' ||
                selectedField.field_type === 'checkbox') && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                    value={
                      selectedField.options
                        ?.map((opt) => opt.label)
                        .join('\n') || ''
                    }
                    onChange={(e) => {
                      const lines = e.target.value.split('\n')
                      const options = lines
                        .filter((line) => line.trim())
                        .map((line) => ({
                          label: line.trim(),
                          value: line.trim().toLowerCase().replace(/\s+/g, '_'),
                        }))
                      updateField(selectedField.id, { options })
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fields List */}
      <div className="space-y-4 overflow-y-auto pr-2">
        <div className="flex items-center justify-between sticky top-0 bg-background pb-2 z-10">
          <div>
            <h3 className="text-lg font-semibold">Form Fields</h3>
            <p className="text-sm text-muted-foreground">
              Click to edit, drag to reorder
            </p>
          </div>
          <Button onClick={addField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>

        {form.fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No fields added yet. Click "Add Field" to get started.
              </p>
              <Button onClick={addField} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Field
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {form.fields.map((field, index) => (
              <Card
                key={field.id}
                className={`cursor-pointer transition-colors ${
                  selectedField?.id === field.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : ''
                }`}
                onClick={() => setSelectedField(field)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveField(field.id, 'up')
                        }}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.field_label}</span>
                        {field.is_required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({field.field_type})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {field.field_name}
                      </p>
                      {field.help_text && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {field.help_text}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeField(field.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      {showLivePreview && (
        <div className="border-l pl-6 overflow-y-auto">
          <div className="sticky top-0 bg-background pb-4 mb-4 border-b">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <p className="text-sm text-muted-foreground">
              See how your form will look to users
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Welcome Text */}
              {form.welcome_text && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">{form.welcome_text}</p>
                </div>
              )}

              {/* Form Fields Preview */}
              {form.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No fields yet</p>
                  <p className="text-xs mt-1">Add fields to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label>
                        {field.field_label}
                        {field.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>

                      {/* Render different field types */}
                      {field.field_type === 'text' && (
                        <Input
                          placeholder={field.placeholder}
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {field.field_type === 'email' && (
                        <Input
                          type="email"
                          placeholder={field.placeholder || 'email@example.com'}
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {field.field_type === 'phone' && (
                        <Input
                          type="tel"
                          placeholder={field.placeholder || '(555) 123-4567'}
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {field.field_type === 'number' && (
                        <Input
                          type="number"
                          placeholder={field.placeholder}
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <Textarea
                          placeholder={field.placeholder}
                          disabled
                          className="bg-gray-50"
                          rows={3}
                        />
                      )}

                      {field.field_type === 'select' && (
                        <Select disabled>
                          <SelectTrigger className="bg-gray-50">
                            <SelectValue
                              placeholder={
                                field.placeholder || 'Select an option'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {field.field_type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center">
                              <input
                                type="radio"
                                disabled
                                className="mr-2"
                                name={field.field_name}
                              />
                              <label className="text-sm">{option.label}</label>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.field_type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center">
                              <input
                                type="checkbox"
                                disabled
                                className="mr-2"
                              />
                              <label className="text-sm">{option.label}</label>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.field_type === 'date' && (
                        <Input
                          type="date"
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {field.field_type === 'time' && (
                        <Input
                          type="time"
                          disabled
                          className="bg-gray-50"
                        />
                      )}

                      {/* Help Text */}
                      {field.help_text && (
                        <p className="text-xs text-muted-foreground">
                          {field.help_text}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Submit Button Preview */}
                  <div className="pt-4">
                    <Button className="w-full" disabled>
                      {form.submit_button_text}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Status Indicators */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Status:</span>
              <span className={form.is_active ? 'text-green-600' : 'text-gray-500'}>
                {form.is_active ? '✓ Active' : '○ Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Display:</span>
              <span>
                {form.show_on_load ? 'Show on Load' : 'Show on Demand'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Requirement:</span>
              <span>
                {form.required_to_chat ? 'Required to Chat' : 'Optional'}
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
