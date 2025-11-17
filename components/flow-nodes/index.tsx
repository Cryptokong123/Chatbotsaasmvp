'use client'

/**
 * Flow Node Components
 *
 * All custom node types for the flow builder
 */

import { NodeProps } from '@xyflow/react'
import {
  Play,
  MessageSquare,
  HelpCircle,
  GitBranch,
  Globe,
  Variable,
  FileText,
  StopCircle,
  UserPlus,
  Brain,
} from 'lucide-react'
import { BaseFlowNode, NodeField, NodeBadge } from './base-node'
import type {
  StartNodeData,
  MessageNodeData,
  QuestionNodeData,
  ConditionNodeData,
  ApiCallNodeData,
  SetVariableNodeData,
  FormNodeData,
  EndNodeData,
  HandoffNodeData,
  IntentCheckNodeData,
} from '@/types/flow'

// START NODE
export function StartNode({ data }: any) {
  return (
    <BaseFlowNode
      icon={Play}
      title="Start"
      color="#10b981"
      handles={{ target: false, source: true }}
    >
      <p className="text-gray-600">Flow entry point</p>
    </BaseFlowNode>
  )
}

// MESSAGE NODE
export function MessageNode({ data }: any) {
  return (
    <BaseFlowNode icon={MessageSquare} title="Send Message" color="#3b82f6">
      <NodeField label="Message" value={data.message || 'No message set'} />
      {data.delay && data.delay > 0 && (
        <NodeBadge>Delay: {data.delay}ms</NodeBadge>
      )}
    </BaseFlowNode>
  )
}

// QUESTION NODE
export function QuestionNode({ data }: any) {
  return (
    <BaseFlowNode icon={HelpCircle} title="Ask Question" color="#8b5cf6">
      <NodeField label="Question" value={data.question || 'No question set'} />
      <NodeField label="Store in" value={data.variable_name || 'variable'} />
      {data.input_type && (
        <NodeBadge>{data.input_type}</NodeBadge>
      )}
      {data.validation?.type && (
        <NodeBadge variant="warning">Validated</NodeBadge>
      )}
    </BaseFlowNode>
  )
}

// CONDITION NODE
export function ConditionNode({ data }: any) {
  const conditionCount = data.conditions?.length || 0

  return (
    <BaseFlowNode icon={GitBranch} title="Condition" color="#f59e0b">
      <NodeField
        label="Conditions"
        value={`${conditionCount} condition${conditionCount !== 1 ? 's' : ''}`}
      />
      {data.conditions?.slice(0, 2).map((cond, idx) => (
        <div key={idx} className="text-xs text-gray-600 mt-1">
          {cond.variable} {cond.operator} {cond.value}
        </div>
      ))}
      {conditionCount > 2 && (
        <div className="text-xs text-gray-400 mt-1">
          +{conditionCount - 2} more...
        </div>
      )}
    </BaseFlowNode>
  )
}

// API CALL NODE
export function ApiCallNode({ data }: any) {
  return (
    <BaseFlowNode icon={Globe} title="API Call" color="#ec4899">
      <NodeField label="Method" value={data.method || 'GET'} />
      <NodeField label="URL" value={data.url || 'Not configured'} />
      <NodeField label="Store response in" value={data.store_response_in || 'response'} />
      {data.timeout && (
        <NodeBadge>Timeout: {data.timeout}ms</NodeBadge>
      )}
    </BaseFlowNode>
  )
}

// SET VARIABLE NODE
export function SetVariableNode({ data }: any) {
  return (
    <BaseFlowNode icon={Variable} title="Set Variable" color="#14b8a6">
      <NodeField label="Variable" value={data.variable_name || 'variable'} />
      <NodeField label="Value" value={data.value || 'Not set'} />
      {data.operation && data.operation !== 'set' && (
        <NodeBadge>{data.operation}</NodeBadge>
      )}
    </BaseFlowNode>
  )
}

// FORM NODE
export function FormNode({ data }: any) {
  const fieldCount = data.fields?.length || 0

  return (
    <BaseFlowNode icon={FileText} title="Collect Form" color="#6366f1">
      <NodeField label="Title" value={data.title || 'Untitled Form'} />
      <NodeField
        label="Fields"
        value={`${fieldCount} field${fieldCount !== 1 ? 's' : ''}`}
      />
      {data.fields?.slice(0, 2).map((field, idx) => (
        <div key={idx} className="text-xs text-gray-600 mt-1">
          • {field.label} ({field.type})
        </div>
      ))}
      {fieldCount > 2 && (
        <div className="text-xs text-gray-400 mt-1">
          +{fieldCount - 2} more...
        </div>
      )}
    </BaseFlowNode>
  )
}

// END NODE
export function EndNode({ data }: any) {
  const variantMap = {
    success: 'success' as const,
    failure: 'error' as const,
    timeout: 'warning' as const,
  }

  return (
    <BaseFlowNode
      icon={StopCircle}
      title="End"
      color="#ef4444"
      handles={{ target: true, source: false }}
    >
      <NodeBadge variant={variantMap[data.end_type] || 'default'}>
        {data.end_type || 'End'}
      </NodeBadge>
      {data.message && (
        <NodeField label="Message" value={data.message} />
      )}
    </BaseFlowNode>
  )
}

// HANDOFF NODE
export function HandoffNode({ data }: any) {
  return (
    <BaseFlowNode icon={UserPlus} title="Handoff" color="#f97316">
      <NodeField label="Type" value={data.handoff_type || 'human'} />
      <NodeField label="Message" value={data.message || 'No message'} />
      {data.priority && (
        <NodeBadge variant={data.priority === 'urgent' ? 'error' : 'warning'}>
          {data.priority}
        </NodeBadge>
      )}
      {data.department && (
        <div className="text-xs text-gray-600 mt-1">→ {data.department}</div>
      )}
    </BaseFlowNode>
  )
}

// INTENT CHECK NODE
export function IntentCheckNode({ data }: any) {
  const intentCount = data.intents?.length || 0

  return (
    <BaseFlowNode icon={Brain} title="Check Intent" color="#a855f7">
      <NodeField
        label="Intents"
        value={`${intentCount} intent${intentCount !== 1 ? 's' : ''}`}
      />
      {data.use_ai && <NodeBadge variant="success">AI Powered</NodeBadge>}
      {data.confidence_threshold && (
        <div className="text-xs text-gray-600 mt-1">
          Confidence: {(data.confidence_threshold * 100).toFixed(0)}%
        </div>
      )}
      {data.intents?.slice(0, 2).map((intent, idx) => (
        <div key={idx} className="text-xs text-gray-600 mt-1">
          • {intent.intent}
        </div>
      ))}
    </BaseFlowNode>
  )
}

// Export all node types
export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  api_call: ApiCallNode,
  set_variable: SetVariableNode,
  form: FormNode,
  end: EndNode,
  handoff: HandoffNode,
  intent_check: IntentCheckNode,
} as any
