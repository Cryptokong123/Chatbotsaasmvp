'use client'

/**
 * Visual Flow Builder
 *
 * Drag-and-drop conversation flow editor using React Flow
 */

import { useCallback, useState, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { nodeTypes } from './flow-nodes'
import type { ConversationFlow, NodeType, NodeData, FlowNode } from '@/types/flow'
import { validateFlow, getValidationSummary, type ValidationResult } from '@/lib/flow-validator'
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
  Save,
  Play as PlayIcon,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface FlowBuilderProps {
  initialFlow?: ConversationFlow
  onSave: (flow: ConversationFlow) => void
  onTest?: (flow: ConversationFlow) => void
}

const nodeTypeConfig: Record<NodeType, { icon: any; label: string; color: string }> = {
  start: { icon: Play, label: 'Start', color: '#10b981' },
  message: { icon: MessageSquare, label: 'Message', color: '#3b82f6' },
  question: { icon: HelpCircle, label: 'Question', color: '#8b5cf6' },
  condition: { icon: GitBranch, label: 'Condition', color: '#f59e0b' },
  api_call: { icon: Globe, label: 'API Call', color: '#ec4899' },
  set_variable: { icon: Variable, label: 'Set Variable', color: '#14b8a6' },
  form: { icon: FileText, label: 'Form', color: '#6366f1' },
  end: { icon: StopCircle, label: 'End', color: '#ef4444' },
  handoff: { icon: UserPlus, label: 'Handoff', color: '#f97316' },
  intent_check: { icon: Brain, label: 'Intent Check', color: '#a855f7' },
}

export function FlowBuilder({ initialFlow, onSave, onTest }: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>((initialFlow?.nodes as FlowNode[]) || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || [])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [flowName, setFlowName] = useState(initialFlow?.name || 'New Flow')
  const [flowDescription, setFlowDescription] = useState(initialFlow?.description || '')
  const [triggerType, setTriggerType] = useState<ConversationFlow['trigger_type']>(
    initialFlow?.trigger_type || 'keyword'
  )
  const [triggerValue, setTriggerValue] = useState(initialFlow?.trigger_value || '')
  const [showValidation, setShowValidation] = useState(true)
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  })

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const nodeIdCounter = useRef(1)

  // Validate flow whenever nodes or edges change
  useEffect(() => {
    const currentFlow: ConversationFlow = {
      name: flowName,
      description: flowDescription,
      trigger_type: triggerType,
      trigger_value: triggerValue,
      nodes,
      edges,
      entry_node_id: nodes.find((n) => n.type === 'start')?.id,
      is_active: initialFlow?.is_active || false,
      bot_id: initialFlow?.bot_id || '',
      variables: initialFlow?.variables || {},
    }

    const result = validateFlow(currentFlow)
    setValidation(result)
  }, [nodes, edges, flowName, triggerType])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    setSelectedNode(node)
  }, [])

  const addNode = useCallback(
    (type: NodeType) => {
      if (!reactFlowInstance) return

      const id = `${type}-${nodeIdCounter.current++}`
      const position = reactFlowInstance.project({
        x: window.innerWidth / 2 - 100,
        y: 100 + nodes.length * 120,
      })

      const defaultData: Record<NodeType, any> = {
        start: { label: 'Start' },
        message: { label: 'Message', message: 'Hello!' },
        question: {
          label: 'Question',
          question: 'What is your name?',
          variable_name: 'user_name',
          input_type: 'text',
        },
        condition: {
          label: 'Condition',
          conditions: [
            { variable: '', operator: 'equals', value: '', label: 'If true' },
          ],
        },
        api_call: {
          label: 'API Call',
          url: 'https://api.example.com/data',
          method: 'GET',
          store_response_in: 'api_response',
        },
        set_variable: {
          label: 'Set Variable',
          variable_name: 'my_variable',
          value: 'value',
          operation: 'set',
        },
        form: {
          label: 'Form',
          title: 'Contact Information',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
          ],
        },
        end: { label: 'End', end_type: 'success', message: 'Thank you!' },
        handoff: {
          label: 'Handoff',
          handoff_type: 'human',
          message: 'Transferring to a human agent...',
          priority: 'medium',
        },
        intent_check: {
          label: 'Intent Check',
          intents: [{ intent: 'greeting', keywords: ['hello', 'hi'] }],
          use_ai: false,
        },
      }

      const newNode: FlowNode = {
        id,
        type,
        position,
        data: defaultData[type],
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, nodes.length, setNodes]
  )

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    )
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      )

      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...newData } } : null
        )
      }
    },
    [setNodes, selectedNode]
  )

  const handleSave = () => {
    const flow: ConversationFlow = {
      id: initialFlow?.id,
      bot_id: initialFlow?.bot_id || '',
      name: flowName,
      description: flowDescription,
      is_active: true,
      trigger_type: triggerType,
      trigger_value: triggerValue,
      nodes,
      edges,
      variables: {},
      entry_node_id: nodes.find((n) => n.type === 'start')?.id,
    }

    onSave(flow)
  }

  const handleTest = () => {
    if (onTest) {
      const flow: ConversationFlow = {
        id: initialFlow?.id,
        bot_id: initialFlow?.bot_id || '',
        name: flowName,
        description: flowDescription,
        is_active: true,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        nodes,
        edges,
        variables: {},
        entry_node_id: nodes.find((n) => n.type === 'start')?.id,
      }

      onTest(flow)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="font-semibold"
              placeholder="Flow Name"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Validation Badge */}
          <div
            className="cursor-pointer"
            onClick={() => setShowValidation(!showValidation)}
          >
            {validation.isValid && validation.warnings.length === 0 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            ) : validation.errors.length > 0 ? (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {onTest && (
            <Button onClick={handleTest} variant="outline" size="sm">
              <PlayIcon className="h-4 w-4 mr-2" />
              Test Flow
            </Button>
          )}
          <Button onClick={handleSave} size="sm" disabled={!validation.isValid}>
            <Save className="h-4 w-4 mr-2" />
            Save Flow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Flow Settings</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Trigger Type</Label>
                  <Select value={triggerType} onValueChange={(v: any) => setTriggerType(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="intent">Intent</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="button_click">Button Click</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(triggerType === 'keyword' || triggerType === 'intent') && (
                  <div>
                    <Label className="text-xs">Trigger Value</Label>
                    <Input
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      className="h-8"
                      placeholder={triggerType === 'keyword' ? 'e.g., help' : 'e.g., get_support'}
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={flowDescription}
                    onChange={(e) => setFlowDescription(e.target.value)}
                    rows={2}
                    className="text-xs"
                    placeholder="What does this flow do?"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Add Nodes</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(nodeTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      onClick={() => addNode(type as NodeType)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-white transition-colors text-xs"
                      style={{ borderColor: config.color + '40' }}
                    >
                      <div
                        className="p-2 rounded"
                        style={{ backgroundColor: config.color + '20' }}
                      >
                        <Icon className="h-4 w-4" style={{ color: config.color }} />
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedNode && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Selected Node</h3>
                  <Button
                    onClick={deleteSelectedNode}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Click on the canvas to view node properties in the side panel
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                return nodeTypeConfig[node.type as NodeType]?.color || '#gray'
              }}
            />
            <Panel position="top-right">
              <div className="bg-white rounded-lg shadow-lg p-2 text-xs">
                <div className="font-semibold mb-1">Nodes: {nodes.length}</div>
                <div className="text-gray-600">Edges: {edges.length}</div>
              </div>
            </Panel>

            {/* Validation Panel */}
            {showValidation && (
              <Panel position="bottom-right">
                <div className="bg-white rounded-lg shadow-lg p-3 max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {validation.isValid && validation.warnings.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : validation.errors.length > 0 ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-semibold">
                        {getValidationSummary(validation)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowValidation(false)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      <div className="text-xs font-medium text-red-600">Errors:</div>
                      {validation.errors.slice(0, 3).map((error, i) => (
                        <div
                          key={i}
                          className="text-xs bg-red-50 text-red-700 p-2 rounded"
                        >
                          <div className="font-medium">{error.message}</div>
                          {error.suggestion && (
                            <div className="text-red-600 mt-0.5">{error.suggestion}</div>
                          )}
                        </div>
                      ))}
                      {validation.errors.length > 3 && (
                        <div className="text-xs text-red-600">
                          +{validation.errors.length - 3} more errors
                        </div>
                      )}
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-yellow-600">Warnings:</div>
                      {validation.warnings.slice(0, 2).map((warning, i) => (
                        <div
                          key={i}
                          className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded"
                        >
                          <div className="font-medium">{warning.message}</div>
                          {warning.suggestion && (
                            <div className="text-yellow-600 mt-0.5">{warning.suggestion}</div>
                          )}
                        </div>
                      ))}
                      {validation.warnings.length > 2 && (
                        <div className="text-xs text-yellow-600">
                          +{validation.warnings.length - 2} more warnings
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Node Editor Panel */}
        {selectedNode && (
          <NodeEditorPanel
            node={selectedNode}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}

// Wrap FlowBuilder with ReactFlowProvider
export function FlowBuilderWrapper(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  )
}

// Node Editor Side Panel Component
function NodeEditorPanel({
  node,
  onUpdate,
  onClose,
}: {
  node: FlowNode
  onUpdate: (data: Partial<NodeData>) => void
  onClose: () => void
}) {
  const nodeConfig = nodeTypeConfig[node.type as NodeType]

  return (
    <div className="w-96 border-l bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded"
              style={{ backgroundColor: nodeConfig.color + '20' }}
            >
              <nodeConfig.icon className="h-4 w-4" style={{ color: nodeConfig.color }} />
            </div>
            <h3 className="font-semibold">{nodeConfig.label}</h3>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            ×
          </Button>
        </div>
        <p className="text-xs text-gray-600">Node ID: {node.id}</p>
      </div>

      <div className="p-4">
        {/* Render different editors based on node type */}
        {node.type === 'message' && (
          <MessageNodeEditor data={node.data} onUpdate={onUpdate} />
        )}
        {node.type === 'question' && (
          <QuestionNodeEditor data={node.data} onUpdate={onUpdate} />
        )}
        {node.type === 'condition' && (
          <ConditionNodeEditor data={node.data} onUpdate={onUpdate} />
        )}
        {/* Add more node-specific editors as needed */}
      </div>
    </div>
  )
}

// Node-specific editors
function MessageNodeEditor({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Message</Label>
        <Textarea
          value={data.message || ''}
          onChange={(e) => onUpdate({ message: e.target.value })}
          rows={4}
          placeholder="Enter the message to send..."
        />
      </div>
      <div>
        <Label>Delay (ms)</Label>
        <Input
          type="number"
          value={data.delay || 0}
          onChange={(e) => onUpdate({ delay: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  )
}

function QuestionNodeEditor({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Question</Label>
        <Textarea
          value={data.question || ''}
          onChange={(e) => onUpdate({ question: e.target.value })}
          rows={3}
        />
      </div>
      <div>
        <Label>Variable Name</Label>
        <Input
          value={data.variable_name || ''}
          onChange={(e) => onUpdate({ variable_name: e.target.value })}
          placeholder="e.g., user_name"
        />
      </div>
      <div>
        <Label>Input Type</Label>
        <Select
          value={data.input_type || 'text'}
          onValueChange={(value) => onUpdate({ input_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="select">Select</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ConditionNodeEditor({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  const conditions = data.conditions || []

  const addCondition = () => {
    onUpdate({
      conditions: [
        ...conditions,
        { variable: '', operator: 'equals', value: '', label: '' },
      ],
    })
  }

  const updateCondition = (index: number, updates: any) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    onUpdate({ conditions: newConditions })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Conditions</Label>
        {conditions.map((cond: any, idx: number) => (
          <div key={idx} className="border rounded p-2 mb-2 space-y-2">
            <Input
              placeholder="Variable name"
              value={cond.variable}
              onChange={(e) => updateCondition(idx, { variable: e.target.value })}
            />
            <Select
              value={cond.operator}
              onValueChange={(value) => updateCondition(idx, { operator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Value"
              value={cond.value}
              onChange={(e) => updateCondition(idx, { value: e.target.value })}
            />
          </div>
        ))}
        <Button onClick={addCondition} variant="outline" size="sm" className="w-full">
          Add Condition
        </Button>
      </div>
    </div>
  )
}
