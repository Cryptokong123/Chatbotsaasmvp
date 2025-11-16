'use client'

/**
 * Conversation Flows Management Page
 *
 * List, create, edit, and test conversation flows
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Play, Copy, Power, PowerOff, Sparkles } from 'lucide-react'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { FlowBuilderWrapper } from '@/components/flow-builder'
import type { ConversationFlow } from '@/types/flow'
import { flowTemplates, getCategories, type FlowTemplate } from '@/lib/flow-templates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BotFlowsPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()

  const [flows, setFlows] = useState<ConversationFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFlow, setEditingFlow] = useState<ConversationFlow | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [testingFlow, setTestingFlow] = useState<ConversationFlow | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetchFlows()
  }, [botId])

  const fetchFlows = async () => {
    try {
      const response = await fetch(`/api/flows?botId=${botId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setFlows(data.flows || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch flows',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFlow = async (flow: ConversationFlow) => {
    try {
      const method = flow.id ? 'PUT' : 'POST'
      const response = await fetch('/api/flows', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...flow, bot_id: botId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: flow.id ? 'Flow updated successfully' : 'Flow created successfully',
      })

      setShowBuilder(false)
      setEditingFlow(null)
      fetchFlows()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save flow',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return

    try {
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: 'Flow deleted successfully',
      })

      fetchFlows()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete flow',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (flow: ConversationFlow) => {
    try {
      const response = await fetch('/api/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flow,
          is_active: !flow.is_active,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: flow.is_active ? 'Flow deactivated' : 'Flow activated',
      })

      fetchFlows()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle flow',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicateFlow = (flow: ConversationFlow) => {
    const duplicatedFlow: ConversationFlow = {
      ...flow,
      id: undefined,
      name: `${flow.name} (Copy)`,
      is_active: false,
    }

    setEditingFlow(duplicatedFlow)
    setShowBuilder(true)
  }

  const handleUseTemplate = (template: FlowTemplate) => {
    const newFlow: ConversationFlow = {
      ...template.flow,
      name: template.name,
      description: template.description,
      is_active: false,
    } as ConversationFlow

    setEditingFlow(newFlow)
    setShowTemplates(false)
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
          <h1 className="text-3xl font-bold">Conversation Flows</h1>
          <p className="text-gray-600 mt-1">
            Create visual conversation flows with conditional logic
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button
            onClick={() => {
              setEditingFlow(null)
              setShowBuilder(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create from Scratch
          </Button>
        </div>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              No conversation flows created yet.
              <br />
              Build visual flows with conditions, API calls, and more.
            </p>
            <Button
              onClick={() => {
                setEditingFlow(null)
                setShowBuilder(true)
              }}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {flow.name}
                      {flow.is_active && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    {flow.description && (
                      <CardDescription className="mt-1">
                        {flow.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• {flow.nodes?.length || 0} node(s)</p>
                  <p>• {flow.edges?.length || 0} connection(s)</p>
                  <p>
                    • Trigger: {flow.trigger_type}
                    {flow.trigger_value && ` (${flow.trigger_value})`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestingFlow(flow)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingFlow(flow)
                      setShowBuilder(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateFlow(flow)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(flow)}
                  >
                    {flow.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFlow(flow.id!)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Flow Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] p-0">
          <div className="h-[95vh]">
            <FlowBuilderWrapper
              initialFlow={editingFlow || undefined}
              onSave={handleSaveFlow}
              onTest={(flow) => {
                setShowBuilder(false)
                setTestingFlow(flow)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Flow Testing Dialog */}
      <Dialog open={!!testingFlow} onOpenChange={() => setTestingFlow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Flow: {testingFlow?.name}</DialogTitle>
          </DialogHeader>
          {testingFlow && <FlowTester flow={testingFlow} />}
        </DialogContent>
      </Dialog>

      {/* Template Gallery Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Flow Templates</DialogTitle>
            <DialogDescription>
              Start with a professional template and customize it to your needs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              {getCategories().map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flowTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="capitalize">{template.category.replace('_', ' ')}</span>
                        <span>
                          {template.flow.nodes?.length || 0} nodes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {getCategories().map((cat) => (
              <TabsContent
                key={cat.value}
                value={cat.value}
                className="max-h-[60vh] overflow-y-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flowTemplates
                    .filter((t) => t.category === cat.value)
                    .map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-primary" />
                            {template.name}
                          </CardTitle>
                          <CardDescription>
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="capitalize">
                              {template.category.replace('_', ' ')}
                            </span>
                            <span>
                              {template.flow.nodes?.length || 0} nodes
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Flow Testing Component
function FlowTester({ flow }: { flow: ConversationFlow }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [context, setContext] = useState<any>({
    conversationId: 'test-conversation',
    sessionId: 'test-session',
    botId: 'test-bot',
    variables: {},
    currentNodeId: flow.entry_node_id || flow.nodes.find((n) => n.type === 'start')?.id || '',
    executionPath: [],
    status: 'running' as const,
  })
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Start flow execution
    if (context.currentNodeId) {
      executeCurrentNode()
    }
  }, [])

  const executeCurrentNode = async (userInput?: string) => {
    if (isCompleted || !context.currentNodeId) return

    setRunning(true)
    setExecutionLog((prev) => [...prev, `Executing node: ${context.currentNodeId}`])

    try {
      // Import and use the actual execution engine
      const { FlowExecutionEngine } = await import('@/lib/flow-execution-engine')
      const engine = new FlowExecutionEngine(flow, context)
      const result = await engine.executeCurrentNode(userInput)

      // Add assistant messages to chat
      if (result.messages && result.messages.length > 0) {
        setMessages((prev) => [...prev, ...result.messages])
      }

      // Update variables
      if (result.variables) {
        setContext((prev: any) => ({
          ...prev,
          variables: result.variables,
        }))
      }

      // Log execution details
      setExecutionLog((prev) => [
        ...prev,
        `Status: ${result.status}`,
        result.nextNodeId ? `Next node: ${result.nextNodeId}` : 'No next node',
      ])

      // Handle flow completion
      if (result.status === 'completed' || result.status === 'failed') {
        setIsCompleted(true)
        setRunning(false)
        if (result.error) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Error: ${result.error}` },
          ])
        }
        if (result.handoffRequested) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '🔄 Handoff to human agent requested' },
          ])
        }
        return
      }

      // Move to next node if not paused
      if (!result.shouldPause && result.nextNodeId) {
        setContext((prev: any) => ({
          ...prev,
          currentNodeId: result.nextNodeId,
        }))

        // Auto-execute next node after a delay
        setTimeout(() => {
          setContext((prev: any) => {
            executeCurrentNodeWithContext(prev, result.nextNodeId)
            return prev
          })
        }, 500)
      } else {
        setRunning(false)
      }
    } catch (error: any) {
      setExecutionLog((prev) => [...prev, `Error: ${error.message}`])
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Execution error: ${error.message}` },
      ])
      setIsCompleted(true)
    } finally {
      if (!context.currentNodeId || isCompleted) {
        setRunning(false)
      }
    }
  }

  const executeCurrentNodeWithContext = async (ctx: any, nextNodeId?: string) => {
    const updatedContext = {
      ...ctx,
      currentNodeId: nextNodeId || ctx.currentNodeId,
    }
    setContext(updatedContext)

    setRunning(true)
    setExecutionLog((prev) => [...prev, `Executing node: ${updatedContext.currentNodeId}`])

    try {
      const { FlowExecutionEngine } = await import('@/lib/flow-execution-engine')
      const engine = new FlowExecutionEngine(flow, updatedContext)
      const result = await engine.executeCurrentNode()

      if (result.messages && result.messages.length > 0) {
        setMessages((prev) => [...prev, ...result.messages])
      }

      if (result.variables) {
        setContext((prev: any) => ({
          ...prev,
          variables: result.variables,
        }))
      }

      setExecutionLog((prev) => [
        ...prev,
        `Status: ${result.status}`,
        result.nextNodeId ? `Next node: ${result.nextNodeId}` : 'No next node',
      ])

      if (result.status === 'completed' || result.status === 'failed') {
        setIsCompleted(true)
        setRunning(false)
        if (result.error) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Error: ${result.error}` },
          ])
        }
        return
      }

      if (!result.shouldPause && result.nextNodeId) {
        setTimeout(() => {
          executeCurrentNodeWithContext(
            { ...updatedContext, variables: result.variables },
            result.nextNodeId
          )
        }, 500)
      } else {
        setRunning(false)
      }
    } catch (error: any) {
      setExecutionLog((prev) => [...prev, `Error: ${error.message}`])
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Execution error: ${error.message}` },
      ])
      setIsCompleted(true)
      setRunning(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || running || isCompleted) return

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setExecutionLog((prev) => [...prev, `User input: ${input}`])

    // Execute with user input
    const userInputValue = input
    setInput('')
    executeCurrentNode(userInputValue)
  }

  const handleReset = () => {
    setMessages([])
    setInput('')
    setRunning(false)
    setContext({
      conversationId: 'test-conversation',
      sessionId: 'test-session',
      botId: 'test-bot',
      variables: {},
      currentNodeId: flow.entry_node_id || flow.nodes.find((n) => n.type === 'start')?.id || '',
      executionPath: [],
      status: 'running' as const,
    })
    setExecutionLog([])
    setIsCompleted(false)

    // Restart execution
    setTimeout(() => executeCurrentNode(), 100)
  }

  return (
    <div className="space-y-4">
      {/* Debug Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Test
          </Button>
        </div>
        {isCompleted && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Flow completed
          </span>
        )}
      </div>

      {/* Messages Display */}
      <div className="border rounded-lg p-4 bg-gray-50 h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {running && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isCompleted ? 'Flow completed' : 'Type your response...'}
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={running || isCompleted}
        />
        <Button onClick={handleSend} disabled={running || !input.trim() || isCompleted}>
          Send
        </Button>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="space-y-3 text-xs">
          {/* Variables */}
          {Object.keys(context.variables).length > 0 && (
            <div>
              <div className="font-semibold mb-1">Variables:</div>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(context.variables, null, 2)}
              </pre>
            </div>
          )}

          {/* Current Node */}
          <div>
            <div className="font-semibold mb-1">Current Node:</div>
            <div className="bg-gray-100 p-2 rounded">
              {context.currentNodeId || 'None'}
            </div>
          </div>

          {/* Execution Path */}
          {context.executionPath.length > 0 && (
            <div>
              <div className="font-semibold mb-1">Execution Path:</div>
              <div className="bg-gray-100 p-2 rounded">
                {context.executionPath.join(' → ')}
              </div>
            </div>
          )}

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div>
              <div className="font-semibold mb-1">Execution Log:</div>
              <pre className="bg-gray-100 p-2 rounded h-40 overflow-y-auto">
                {executionLog.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
