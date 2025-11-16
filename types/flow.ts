/**
 * Flow Node Types
 *
 * Type definitions for all conversation flow nodes
 */

export type NodeType =
  | 'start'
  | 'message'
  | 'question'
  | 'condition'
  | 'api_call'
  | 'set_variable'
  | 'form'
  | 'end'
  | 'handoff'
  | 'intent_check'

export interface BaseNodeData {
  label: string
}

export interface StartNodeData extends BaseNodeData {
  // Entry point - no additional data needed
}

export interface MessageNodeData extends BaseNodeData {
  message: string
  delay?: number // Milliseconds to wait before sending
}

export interface QuestionNodeData extends BaseNodeData {
  question: string
  variable_name: string
  input_type: 'text' | 'number' | 'email' | 'phone' | 'select'
  options?: Array<{ label: string; value: string }>
  validation?: {
    type: 'regex' | 'min' | 'max' | 'required'
    pattern?: string
    min?: number
    max?: number
    error_message?: string
  }
}

export interface ConditionNodeData extends BaseNodeData {
  conditions: Array<{
    variable: string
    operator: string
    value: string
    next_node?: string
    label?: string
  }>
  default_next_node?: string
}

export interface ApiCallNodeData extends BaseNodeData {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string
  store_response_in: string
  on_success?: string
  on_error?: string
  timeout?: number
}

export interface SetVariableNodeData extends BaseNodeData {
  variable_name: string
  value: string // Can include {{variable}} placeholders
  operation?: 'set' | 'append' | 'increment' | 'decrement'
}

export interface FormNodeData extends BaseNodeData {
  title: string
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select'
    required: boolean
    placeholder?: string
    options?: Array<{ label: string; value: string }>
  }>
}

export interface EndNodeData extends BaseNodeData {
  end_type: 'success' | 'failure' | 'timeout'
  message?: string
}

export interface HandoffNodeData extends BaseNodeData {
  handoff_type: 'human' | 'email' | 'ticket'
  message: string
  assign_to?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  department?: string
}

export interface IntentCheckNodeData extends BaseNodeData {
  intents: Array<{
    intent: string
    keywords?: string[]
    next_node?: string
  }>
  use_ai: boolean
  confidence_threshold?: number
  default_next_node?: string
}

export type NodeData =
  | StartNodeData
  | MessageNodeData
  | QuestionNodeData
  | ConditionNodeData
  | ApiCallNodeData
  | SetVariableNodeData
  | FormNodeData
  | EndNodeData
  | HandoffNodeData
  | IntentCheckNodeData

export interface FlowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: NodeData
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  sourceHandle?: string
  targetHandle?: string
}

export interface ConversationFlow {
  id?: string
  bot_id: string
  name: string
  description?: string
  is_active: boolean
  trigger_type: 'keyword' | 'intent' | 'always' | 'button_click'
  trigger_value?: string
  entry_node_id?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  variables: Record<string, any>
  variables_schema?: Record<string, string>
}
