'use client'

/**
 * Pre-Chat Form Renderer
 *
 * Displays the form to end users and collects their information
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { FormField, PreChatForm } from './pre-chat-form-builder'

interface PreChatFormRendererProps {
  form: PreChatForm
  onSubmit: (formData: Record<string, any>) => void | Promise<void>
  onSkip?: () => void
  className?: string
}

export function PreChatFormRenderer({
  form,
  onSubmit,
  onSkip,
  className = '',
}: PreChatFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {}
    form.fields.forEach((field) => {
      if (field.default_value) {
        initialData[field.field_name] = field.default_value
      }
    })
    setFormData(initialData)
  }, [form.fields])

  const validateField = (field: FormField, value: any): string | null => {
    // Required field validation
    if (field.is_required && (!value || value.toString().trim() === '')) {
      return `${field.field_label} is required`
    }

    // Type-specific validation
    if (value && value.toString().trim() !== '') {
      switch (field.field_type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address'
          }
          break

        case 'phone':
          const phoneRegex = /^[\d\s\-\+\(\)]+$/
          if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
            return 'Please enter a valid phone number'
          }
          break

        case 'number':
          if (isNaN(Number(value))) {
            return 'Please enter a valid number'
          }
          break

        case 'email':
          const emailRegex2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex2.test(value)) {
            return 'Please enter a valid email address'
          }
          break
      }

      // Custom validation rules
      if (field.validation_rules) {
        const rules = field.validation_rules

        if (rules.min && value.length < rules.min) {
          return `Must be at least ${rules.min} characters`
        }

        if (rules.max && value.length > rules.max) {
          return `Must be no more than ${rules.max} characters`
        }

        if (rules.pattern) {
          const regex = new RegExp(rules.pattern)
          if (!regex.test(value)) {
            return rules.error_message || 'Invalid format'
          }
        }
      }
    }

    return null
  }

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional_logic) return true

    const { field: dependentField, operator, value } = field.conditional_logic
    const dependentValue = formData[dependentField]

    switch (operator) {
      case 'equals':
        return dependentValue === value
      case 'not_equals':
        return dependentValue !== value
      case 'contains':
        return dependentValue?.includes(value)
      case 'is_empty':
        return !dependentValue || dependentValue === ''
      case 'is_not_empty':
        return !!dependentValue && dependentValue !== ''
      default:
        return true
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all visible fields
    const newErrors: Record<string, string> = {}
    form.fields.forEach((field) => {
      if (shouldShowField(field)) {
        const error = validateField(field, formData[field.field_name])
        if (error) {
          newErrors[field.field_name] = error
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null

    const value = formData[field.field_name] || ''
    const error = errors[field.field_name]

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.field_name}>
          {field.field_label}
          {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.field_type === 'text' && (
          <Input
            id={field.field_name}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'email' && (
          <Input
            id={field.field_name}
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'phone' && (
          <Input
            id={field.field_name}
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'number' && (
          <Input
            id={field.field_name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'textarea' && (
          <Textarea
            id={field.field_name}
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'select' && (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.field_name, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
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
          <RadioGroup
            value={value}
            onValueChange={(val) => handleFieldChange(field.field_name, val)}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.field_name}-${option.value}`} />
                <Label htmlFor={`${field.field_name}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.field_type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.field_name}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || []
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value)
                    handleFieldChange(field.field_name, newValues)
                  }}
                />
                <Label htmlFor={`${field.field_name}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {field.field_type === 'date' && (
          <Input
            id={field.field_name}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.field_type === 'time' && (
          <Input
            id={field.field_name}
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.help_text && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {form.welcome_text && (
        <div className="mb-6">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {form.welcome_text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.fields
          .sort((a, b) => a.order_index - b.order_index)
          .map((field) => renderField(field))}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : form.submit_button_text}
          </Button>

          {!form.required_to_chat && onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={submitting}
            >
              Skip
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
