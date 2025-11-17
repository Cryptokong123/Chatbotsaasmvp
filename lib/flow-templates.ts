/**
 * Professional Flow Templates Library
 *
 * Pre-built conversation flow templates for common use cases
 */

import type { ConversationFlow } from '@/types/flow'

export interface FlowTemplate {
  id: string
  name: string
  description: string
  category: 'customer_service' | 'sales' | 'hr' | 'support' | 'general'
  icon: string
  flow: Omit<ConversationFlow, 'id' | 'bot_id' | 'created_at' | 'updated_at'>
}

export const flowTemplates: FlowTemplate[] = [
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Qualify sales leads by collecting key information and routing based on budget and timeline',
    category: 'sales',
    icon: 'TrendingUp',
    flow: {
      name: 'Lead Qualification Flow',
      description: 'Qualifies leads and routes to appropriate sales team',
      trigger_type: 'keyword',
      trigger_value: 'interested, pricing, demo',
      is_active: false,
      entry_node_id: 'start-1',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 250, y: 150 },
          data: {
            label: 'Welcome',
            message: 'Hi! I\'d love to learn more about your needs. Let me ask you a few quick questions.',
          },
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 250, y: 250 },
          data: {
            label: 'Ask Name',
            question: 'What\'s your name?',
            variable_name: 'customer_name',
            input_type: 'text',
            validation: { type: 'required', error_message: 'Please enter your name' },
          },
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 250, y: 350 },
          data: {
            label: 'Ask Company',
            question: 'What company are you with?',
            variable_name: 'company_name',
            input_type: 'text',
          },
        },
        {
          id: 'question-3',
          type: 'question',
          position: { x: 250, y: 450 },
          data: {
            label: 'Ask Budget',
            question: 'What\'s your approximate budget range? (e.g., $5k, $10k, $50k+)',
            variable_name: 'budget',
            input_type: 'text',
          },
        },
        {
          id: 'question-4',
          type: 'question',
          position: { x: 250, y: 550 },
          data: {
            label: 'Ask Timeline',
            question: 'When are you looking to get started?',
            variable_name: 'timeline',
            input_type: 'select',
            options: [
              { label: 'Immediately', value: 'immediate' },
              { label: 'Within 1 month', value: '1month' },
              { label: 'Within 3 months', value: '3months' },
              { label: 'Just exploring', value: 'exploring' },
            ],
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 250, y: 650 },
          data: {
            label: 'Check Timeline',
            conditions: [
              { variable: 'timeline', operator: 'equals', value: 'immediate', next_node: 'handoff-1' },
              { variable: 'timeline', operator: 'equals', value: '1month', next_node: 'handoff-1' },
            ],
            default_next_node: 'message-2',
          },
        },
        {
          id: 'handoff-1',
          type: 'handoff',
          position: { x: 100, y: 750 },
          data: {
            label: 'Urgent Lead',
            message: 'Perfect! Let me connect you with our sales team right away. They\'ll be with you in just a moment.',
            department: 'sales',
            priority: 'high',
          },
        },
        {
          id: 'message-2',
          type: 'message',
          position: { x: 400, y: 750 },
          data: {
            label: 'Thank You',
            message: 'Thanks {{customer_name}}! We\'ll send you more information via email and follow up soon.',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 400, y: 850 },
          data: {
            label: 'Complete',
            message: 'Have a great day!',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'question-1' },
        { id: 'e3', source: 'question-1', target: 'question-2' },
        { id: 'e4', source: 'question-2', target: 'question-3' },
        { id: 'e5', source: 'question-3', target: 'question-4' },
        { id: 'e6', source: 'question-4', target: 'condition-1' },
        { id: 'e7', source: 'condition-1', target: 'handoff-1' },
        { id: 'e8', source: 'condition-1', target: 'message-2' },
        { id: 'e9', source: 'message-2', target: 'end-1' },
      ],
      variables: {},
      variables_schema: {
        customer_name: 'string',
        company_name: 'string',
        budget: 'string',
        timeline: 'string',
      },
    },
  },

  {
    id: 'order-tracking',
    name: 'Order Status Lookup',
    description: 'Help customers check their order status using order number',
    category: 'customer_service',
    icon: 'Package',
    flow: {
      name: 'Order Tracking Flow',
      description: 'Looks up order status via API',
      trigger_type: 'keyword',
      trigger_value: 'order, tracking, where is my order',
      is_active: false,
      entry_node_id: 'start-1',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 250, y: 150 },
          data: {
            label: 'Greeting',
            message: 'I can help you track your order!',
          },
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 250, y: 250 },
          data: {
            label: 'Ask Order Number',
            question: 'Please enter your order number:',
            variable_name: 'order_number',
            input_type: 'text',
            validation: {
              type: 'regex',
              pattern: '^[A-Z0-9]{6,12}$',
              error_message: 'Please enter a valid order number (6-12 characters)',
            },
          },
        },
        {
          id: 'api-1',
          type: 'api_call',
          position: { x: 250, y: 350 },
          data: {
            label: 'Lookup Order',
            url: 'https://api.example.com/orders/{{order_number}}',
            method: 'GET',
            headers: {},
            store_response_in: 'order_data',
            timeout: 10000,
            on_success: 'condition-1',
            on_error: 'message-error',
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 250, y: 450 },
          data: {
            label: 'Check Status',
            conditions: [
              { variable: 'order_data.status', operator: 'equals', value: 'shipped', next_node: 'message-shipped' },
              { variable: 'order_data.status', operator: 'equals', value: 'delivered', next_node: 'message-delivered' },
              { variable: 'order_data.status', operator: 'equals', value: 'processing', next_node: 'message-processing' },
            ],
            default_next_node: 'message-unknown',
          },
        },
        {
          id: 'message-shipped',
          type: 'message',
          position: { x: 50, y: 550 },
          data: {
            label: 'Shipped',
            message: 'Great news! Your order has been shipped and is on its way. Tracking: {{order_data.tracking_number}}',
          },
        },
        {
          id: 'message-delivered',
          type: 'message',
          position: { x: 200, y: 550 },
          data: {
            label: 'Delivered',
            message: 'Your order was delivered on {{order_data.delivered_date}}. Enjoy!',
          },
        },
        {
          id: 'message-processing',
          type: 'message',
          position: { x: 350, y: 550 },
          data: {
            label: 'Processing',
            message: 'Your order is being processed and will ship soon. Estimated ship date: {{order_data.ship_date}}',
          },
        },
        {
          id: 'message-unknown',
          type: 'message',
          position: { x: 500, y: 550 },
          data: {
            label: 'Unknown',
            message: 'Your order status is: {{order_data.status}}',
          },
        },
        {
          id: 'message-error',
          type: 'message',
          position: { x: 450, y: 350 },
          data: {
            label: 'Error',
            message: 'I couldn\'t find that order. Please double-check your order number.',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 250, y: 650 },
          data: {
            label: 'Complete',
            message: 'Is there anything else I can help you with?',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'question-1' },
        { id: 'e3', source: 'question-1', target: 'api-1' },
        { id: 'e4', source: 'api-1', target: 'condition-1' },
        { id: 'e5', source: 'condition-1', target: 'message-shipped' },
        { id: 'e6', source: 'condition-1', target: 'message-delivered' },
        { id: 'e7', source: 'condition-1', target: 'message-processing' },
        { id: 'e8', source: 'condition-1', target: 'message-unknown' },
        { id: 'e9', source: 'message-shipped', target: 'end-1' },
        { id: 'e10', source: 'message-delivered', target: 'end-1' },
        { id: 'e11', source: 'message-processing', target: 'end-1' },
        { id: 'e12', source: 'message-unknown', target: 'end-1' },
        { id: 'e13', source: 'message-error', target: 'end-1' },
      ],
      variables: {},
      variables_schema: {
        order_number: 'string',
        order_data: 'object',
      },
    },
  },

  {
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Schedule appointments with availability checking',
    category: 'general',
    icon: 'Calendar',
    flow: {
      name: 'Appointment Booking Flow',
      description: 'Collects information and schedules appointments',
      trigger_type: 'keyword',
      trigger_value: 'book, schedule, appointment',
      is_active: false,
      entry_node_id: 'start-1',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 250, y: 150 },
          data: {
            label: 'Welcome',
            message: 'I\'ll help you schedule an appointment!',
          },
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 250, y: 250 },
          data: {
            label: 'Ask Name',
            question: 'What\'s your name?',
            variable_name: 'name',
            input_type: 'text',
          },
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 250, y: 350 },
          data: {
            label: 'Ask Email',
            question: 'What\'s your email address?',
            variable_name: 'email',
            input_type: 'email',
            validation: { type: 'required', error_message: 'Valid email required' },
          },
        },
        {
          id: 'question-3',
          type: 'question',
          position: { x: 250, y: 450 },
          data: {
            label: 'Ask Service',
            question: 'What service are you interested in?',
            variable_name: 'service',
            input_type: 'select',
            options: [
              { label: 'Consultation', value: 'consultation' },
              { label: 'Product Demo', value: 'demo' },
              { label: 'Support Session', value: 'support' },
            ],
          },
        },
        {
          id: 'question-4',
          type: 'question',
          position: { x: 250, y: 550 },
          data: {
            label: 'Ask Date',
            question: 'What date would you prefer? (YYYY-MM-DD)',
            variable_name: 'preferred_date',
            input_type: 'text',
          },
        },
        {
          id: 'api-1',
          type: 'api_call',
          position: { x: 250, y: 650 },
          data: {
            label: 'Book Appointment',
            url: 'https://api.example.com/appointments',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: '{{name}}',
              email: '{{email}}',
              service: '{{service}}',
              date: '{{preferred_date}}',
            }),
            store_response_in: 'booking_result',
            timeout: 10000,
            on_success: 'message-success',
            on_error: 'message-error',
          },
        },
        {
          id: 'message-success',
          type: 'message',
          position: { x: 150, y: 750 },
          data: {
            label: 'Confirmed',
            message: 'Perfect! Your appointment is confirmed for {{booking_result.confirmed_date}} at {{booking_result.time}}. You\'ll receive a confirmation email shortly.',
          },
        },
        {
          id: 'message-error',
          type: 'message',
          position: { x: 350, y: 750 },
          data: {
            label: 'Error',
            message: 'Sorry, that time slot isn\'t available. Please contact us at support@example.com to schedule.',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 250, y: 850 },
          data: {
            label: 'Complete',
            message: 'Thank you!',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'question-1' },
        { id: 'e3', source: 'question-1', target: 'question-2' },
        { id: 'e4', source: 'question-2', target: 'question-3' },
        { id: 'e5', source: 'question-3', target: 'question-4' },
        { id: 'e6', source: 'question-4', target: 'api-1' },
        { id: 'e7', source: 'api-1', target: 'message-success' },
        { id: 'e8', source: 'api-1', target: 'message-error' },
        { id: 'e9', source: 'message-success', target: 'end-1' },
        { id: 'e10', source: 'message-error', target: 'end-1' },
      ],
      variables: {},
      variables_schema: {
        name: 'string',
        email: 'string',
        service: 'string',
        preferred_date: 'string',
        booking_result: 'object',
      },
    },
  },

  {
    id: 'support-ticket',
    name: 'Support Ticket Creation',
    description: 'Create support tickets with priority and category classification',
    category: 'support',
    icon: 'HelpCircle',
    flow: {
      name: 'Support Ticket Flow',
      description: 'Creates and prioritizes support tickets',
      trigger_type: 'keyword',
      trigger_value: 'help, issue, problem, not working',
      is_active: false,
      entry_node_id: 'start-1',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 250, y: 150 },
          data: {
            label: 'Greeting',
            message: 'I\'m sorry you\'re experiencing an issue. Let me help you create a support ticket.',
          },
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 250, y: 250 },
          data: {
            label: 'Ask Description',
            question: 'Please describe the issue you\'re experiencing:',
            variable_name: 'issue_description',
            input_type: 'text',
            validation: { type: 'required', error_message: 'Please describe your issue' },
          },
        },
        {
          id: 'intent-1',
          type: 'intent_check',
          position: { x: 250, y: 350 },
          data: {
            label: 'Classify Urgency',
            use_ai: false,
            intents: [
              { intent: 'urgent', keywords: ['urgent', 'critical', 'down', 'not working', 'broken'], next_node: 'set-1' },
              { intent: 'normal', keywords: ['question', 'how to', 'wondering'], next_node: 'set-2' },
            ],
            default_next_node: 'set-2',
          },
        },
        {
          id: 'set-1',
          type: 'set_variable',
          position: { x: 150, y: 450 },
          data: {
            label: 'Set High Priority',
            variable_name: 'priority',
            value: 'high',
            operation: 'set',
          },
        },
        {
          id: 'set-2',
          type: 'set_variable',
          position: { x: 350, y: 450 },
          data: {
            label: 'Set Normal Priority',
            variable_name: 'priority',
            value: 'normal',
            operation: 'set',
          },
        },
        {
          id: 'question-2',
          type: 'question',
          position: { x: 250, y: 550 },
          data: {
            label: 'Ask Email',
            question: 'What\'s your email address for updates?',
            variable_name: 'email',
            input_type: 'email',
          },
        },
        {
          id: 'api-1',
          type: 'api_call',
          position: { x: 250, y: 650 },
          data: {
            label: 'Create Ticket',
            url: 'https://api.example.com/tickets',
            method: 'POST',
            headers: {},
            body: JSON.stringify({
              description: '{{issue_description}}',
              priority: '{{priority}}',
              email: '{{email}}',
            }),
            store_response_in: 'ticket',
            timeout: 10000,
            on_success: 'message-success',
            on_error: 'message-error',
          },
        },
        {
          id: 'message-success',
          type: 'message',
          position: { x: 150, y: 750 },
          data: {
            label: 'Success',
            message: 'Your support ticket #{{ticket.id}} has been created with {{priority}} priority. Our team will respond within 24 hours.',
          },
        },
        {
          id: 'message-error',
          type: 'message',
          position: { x: 350, y: 750 },
          data: {
            label: 'Error',
            message: 'Sorry, there was an error creating your ticket. Please email support@example.com directly.',
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 250, y: 850 },
          data: {
            label: 'Check Priority',
            conditions: [
              { variable: 'priority', operator: 'equals', value: 'high', next_node: 'handoff-1' },
            ],
            default_next_node: 'end-1',
          },
        },
        {
          id: 'handoff-1',
          type: 'handoff',
          position: { x: 150, y: 950 },
          data: {
            label: 'Urgent Handoff',
            message: 'Since this is urgent, let me connect you with a support agent immediately.',
            department: 'support',
            priority: 'high',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 350, y: 950 },
          data: {
            label: 'Complete',
            message: 'Thank you for your patience!',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'question-1' },
        { id: 'e3', source: 'question-1', target: 'intent-1' },
        { id: 'e4', source: 'intent-1', target: 'set-1' },
        { id: 'e5', source: 'intent-1', target: 'set-2' },
        { id: 'e6', source: 'set-1', target: 'question-2' },
        { id: 'e7', source: 'set-2', target: 'question-2' },
        { id: 'e8', source: 'question-2', target: 'api-1' },
        { id: 'e9', source: 'api-1', target: 'message-success' },
        { id: 'e10', source: 'api-1', target: 'message-error' },
        { id: 'e11', source: 'message-success', target: 'condition-1' },
        { id: 'e12', source: 'message-error', target: 'end-1' },
        { id: 'e13', source: 'condition-1', target: 'handoff-1' },
        { id: 'e14', source: 'condition-1', target: 'end-1' },
      ],
      variables: {},
      variables_schema: {
        issue_description: 'string',
        priority: 'string',
        email: 'string',
        ticket: 'object',
      },
    },
  },

  {
    id: 'feedback-collection',
    name: 'Customer Feedback Collection',
    description: 'Collect and categorize customer feedback with sentiment analysis',
    category: 'customer_service',
    icon: 'MessageSquare',
    flow: {
      name: 'Feedback Collection Flow',
      description: 'Gathers customer feedback and ratings',
      trigger_type: 'keyword',
      trigger_value: 'feedback, review, suggestion',
      is_active: false,
      entry_node_id: 'start-1',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 250, y: 150 },
          data: {
            label: 'Welcome',
            message: 'We\'d love to hear your feedback! It helps us improve.',
          },
        },
        {
          id: 'question-1',
          type: 'question',
          position: { x: 250, y: 250 },
          data: {
            label: 'Ask Rating',
            question: 'How would you rate your experience? (1-5, where 5 is excellent)',
            variable_name: 'rating',
            input_type: 'number',
            validation: { type: 'min', min: 1, error_message: 'Please enter 1-5' },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 250, y: 350 },
          data: {
            label: 'Check Rating',
            conditions: [
              { variable: 'rating', operator: 'greater_or_equal', value: '4', next_node: 'question-positive' },
              { variable: 'rating', operator: 'less_or_equal', value: '2', next_node: 'question-negative' },
            ],
            default_next_node: 'question-neutral',
          },
        },
        {
          id: 'question-positive',
          type: 'question',
          position: { x: 50, y: 450 },
          data: {
            label: 'Positive Feedback',
            question: 'That\'s great! What did you like most?',
            variable_name: 'feedback',
            input_type: 'text',
          },
        },
        {
          id: 'question-negative',
          type: 'question',
          position: { x: 250, y: 450 },
          data: {
            label: 'Negative Feedback',
            question: 'We\'re sorry to hear that. What can we do better?',
            variable_name: 'feedback',
            input_type: 'text',
          },
        },
        {
          id: 'question-neutral',
          type: 'question',
          position: { x: 450, y: 450 },
          data: {
            label: 'Neutral Feedback',
            question: 'Thank you! Any additional comments?',
            variable_name: 'feedback',
            input_type: 'text',
          },
        },
        {
          id: 'set-1',
          type: 'set_variable',
          position: { x: 250, y: 550 },
          data: {
            label: 'Set Sentiment',
            variable_name: 'sentiment',
            value: 'collected',
            operation: 'set',
          },
        },
        {
          id: 'api-1',
          type: 'api_call',
          position: { x: 250, y: 650 },
          data: {
            label: 'Save Feedback',
            url: 'https://api.example.com/feedback',
            method: 'POST',
            headers: {},
            body: JSON.stringify({
              rating: '{{rating}}',
              feedback: '{{feedback}}',
              sentiment: '{{sentiment}}',
            }),
            store_response_in: 'result',
            timeout: 10000,
            on_success: 'message-thanks',
            on_error: 'message-thanks',
          },
        },
        {
          id: 'message-thanks',
          type: 'message',
          position: { x: 250, y: 750 },
          data: {
            label: 'Thank You',
            message: 'Thank you for your valuable feedback! We appreciate you taking the time.',
          },
        },
        {
          id: 'condition-2',
          type: 'condition',
          position: { x: 250, y: 850 },
          data: {
            label: 'Check for Escalation',
            conditions: [
              { variable: 'rating', operator: 'less_or_equal', value: '2', next_node: 'handoff-1' },
            ],
            default_next_node: 'end-1',
          },
        },
        {
          id: 'handoff-1',
          type: 'handoff',
          position: { x: 150, y: 950 },
          data: {
            label: 'Escalate',
            message: 'We\'d like to make this right. Let me connect you with a manager.',
            department: 'support',
            priority: 'high',
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 350, y: 950 },
          data: {
            label: 'Complete',
            message: 'Have a wonderful day!',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'message-1' },
        { id: 'e2', source: 'message-1', target: 'question-1' },
        { id: 'e3', source: 'question-1', target: 'condition-1' },
        { id: 'e4', source: 'condition-1', target: 'question-positive' },
        { id: 'e5', source: 'condition-1', target: 'question-negative' },
        { id: 'e6', source: 'condition-1', target: 'question-neutral' },
        { id: 'e7', source: 'question-positive', target: 'set-1' },
        { id: 'e8', source: 'question-negative', target: 'set-1' },
        { id: 'e9', source: 'question-neutral', target: 'set-1' },
        { id: 'e10', source: 'set-1', target: 'api-1' },
        { id: 'e11', source: 'api-1', target: 'message-thanks' },
        { id: 'e12', source: 'message-thanks', target: 'condition-2' },
        { id: 'e13', source: 'condition-2', target: 'handoff-1' },
        { id: 'e14', source: 'condition-2', target: 'end-1' },
      ],
      variables: {},
      variables_schema: {
        rating: 'number',
        feedback: 'string',
        sentiment: 'string',
        result: 'object',
      },
    },
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FlowTemplate | undefined {
  return flowTemplates.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: FlowTemplate['category']
): FlowTemplate[] {
  return flowTemplates.filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export function getCategories(): Array<{
  value: FlowTemplate['category']
  label: string
}> {
  return [
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'support', label: 'Technical Support' },
    { value: 'general', label: 'General' },
  ]
}
