/**
 * Flow Execution Engine
 *
 * Runs conversation flows during actual conversations
 */

import type {
  ConversationFlow,
  FlowNode,
  FlowEdge,
  NodeData,
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

export interface FlowExecutionContext {
  conversationId: string
  sessionId: string
  botId: string
  variables: Record<string, any>
  currentNodeId: string
  executionPath: string[]
  status: 'running' | 'completed' | 'paused' | 'failed'
  error?: string
}

export interface FlowExecutionResult {
  messages: Array<{ role: 'assistant' | 'user'; content: string }>
  nextNodeId?: string
  shouldPause: boolean // Wait for user input
  variables: Record<string, any>
  status: 'running' | 'completed' | 'failed'
  error?: string
  handoffRequested?: boolean
}

export class FlowExecutionEngine {
  private flow: ConversationFlow
  private context: FlowExecutionContext

  constructor(flow: ConversationFlow, context: FlowExecutionContext) {
    this.flow = flow
    this.context = context
  }

  /**
   * Execute the current node and determine next action
   */
  async executeCurrentNode(userInput?: string): Promise<FlowExecutionResult> {
    const result: FlowExecutionResult = {
      messages: [],
      shouldPause: false,
      variables: { ...this.context.variables },
      status: 'running',
    }

    const currentNode = this.flow.nodes.find((n) => n.id === this.context.currentNodeId)

    if (!currentNode) {
      return {
        ...result,
        status: 'failed',
        error: 'Current node not found',
      }
    }

    // Add to execution path
    if (!this.context.executionPath.includes(currentNode.id)) {
      this.context.executionPath.push(currentNode.id)
    }

    try {
      switch (currentNode.type) {
        case 'start':
          result.nextNodeId = this.getNextNodeId(currentNode.id)
          break

        case 'message':
          const messageResult = await this.executeMessageNode(currentNode)
          Object.assign(result, messageResult)
          break

        case 'question':
          const questionResult = await this.executeQuestionNode(currentNode, userInput)
          Object.assign(result, questionResult)
          break

        case 'condition':
          const conditionResult = await this.executeConditionNode(currentNode)
          Object.assign(result, conditionResult)
          break

        case 'api_call':
          const apiResult = await this.executeApiCallNode(currentNode)
          Object.assign(result, apiResult)
          break

        case 'set_variable':
          const varResult = await this.executeSetVariableNode(currentNode)
          Object.assign(result, varResult)
          break

        case 'form':
          const formResult = await this.executeFormNode(currentNode, userInput)
          Object.assign(result, formResult)
          break

        case 'end':
          const endResult = await this.executeEndNode(currentNode)
          Object.assign(result, endResult)
          break

        case 'handoff':
          const handoffResult = await this.executeHandoffNode(currentNode)
          Object.assign(result, handoffResult)
          break

        case 'intent_check':
          const intentResult = await this.executeIntentCheckNode(currentNode, userInput)
          Object.assign(result, intentResult)
          break

        default:
          result.status = 'failed'
          result.error = `Unknown node type: ${currentNode.type}`
      }

      return result
    } catch (error: any) {
      return {
        ...result,
        status: 'failed',
        error: error.message || 'Node execution failed',
      }
    }
  }

  private async executeMessageNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as MessageNodeData

    // Interpolate variables in message
    const message = this.interpolateVariables(data.message)

    // Apply delay if specified
    if (data.delay && data.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, data.delay))
    }

    return {
      messages: [{ role: 'assistant', content: message }],
      nextNodeId: this.getNextNodeId(node.id),
    }
  }

  private async executeQuestionNode(
    node: FlowNode,
    userInput?: string
  ): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as QuestionNodeData

    if (!userInput) {
      // First time - ask the question
      const question = this.interpolateVariables(data.question)
      return {
        messages: [{ role: 'assistant', content: question }],
        shouldPause: true, // Wait for user input
      }
    }

    // Validate user input
    if (data.validation) {
      const validationError = this.validateInput(userInput, data.validation)
      if (validationError) {
        return {
          messages: [{ role: 'assistant', content: validationError }],
          shouldPause: true,
        }
      }
    }

    // Store the answer in variables
    const variables = { ...this.context.variables }
    variables[data.variable_name] = userInput

    return {
      variables,
      nextNodeId: this.getNextNodeId(node.id),
    }
  }

  private async executeConditionNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as ConditionNodeData

    // Evaluate conditions
    for (const condition of data.conditions) {
      const varValue = this.context.variables[condition.variable]
      const conditionMet = this.evaluateCondition(
        varValue,
        condition.operator,
        condition.value
      )

      if (conditionMet && condition.next_node) {
        return {
          nextNodeId: condition.next_node,
        }
      }
    }

    // No condition met - use default
    return {
      nextNodeId: data.default_next_node || this.getNextNodeId(node.id),
    }
  }

  private async executeApiCallNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as ApiCallNodeData

    try {
      const url = this.interpolateVariables(data.url)
      const body = data.body ? this.interpolateVariables(data.body) : undefined

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), data.timeout || 30000)

      const response = await fetch(url, {
        method: data.method,
        headers: {
          'Content-Type': 'application/json',
          ...data.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const responseData = await response.json()

      // Store response in variables
      const variables = { ...this.context.variables }
      variables[data.store_response_in] = responseData

      return {
        variables,
        nextNodeId: response.ok ? data.on_success || this.getNextNodeId(node.id) : data.on_error,
      }
    } catch (error: any) {
      return {
        nextNodeId: data.on_error,
        messages: [
          {
            role: 'assistant',
            content: 'An error occurred while fetching data.',
          },
        ],
      }
    }
  }

  private async executeSetVariableNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as SetVariableNodeData

    const variables = { ...this.context.variables }
    const value = this.interpolateVariables(data.value)

    switch (data.operation || 'set') {
      case 'set':
        variables[data.variable_name] = value
        break
      case 'append':
        variables[data.variable_name] = (variables[data.variable_name] || '') + value
        break
      case 'increment':
        variables[data.variable_name] = (parseFloat(variables[data.variable_name]) || 0) + parseFloat(value)
        break
      case 'decrement':
        variables[data.variable_name] = (parseFloat(variables[data.variable_name]) || 0) - parseFloat(value)
        break
    }

    return {
      variables,
      nextNodeId: this.getNextNodeId(node.id),
    }
  }

  private async executeFormNode(
    node: FlowNode,
    userInput?: string
  ): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as FormNodeData

    // In a real implementation, this would integrate with the form renderer
    // For now, we'll return a placeholder
    return {
      messages: [
        {
          role: 'assistant',
          content: `Please fill out the form: ${data.title}`,
        },
      ],
      shouldPause: true,
    }
  }

  private async executeEndNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as EndNodeData

    const message = data.message || 'Conversation ended.'

    return {
      messages: [{ role: 'assistant', content: message }],
      status: 'completed',
    }
  }

  private async executeHandoffNode(node: FlowNode): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as HandoffNodeData

    const message = this.interpolateVariables(data.message)

    return {
      messages: [{ role: 'assistant', content: message }],
      handoffRequested: true,
      status: 'completed',
    }
  }

  private async executeIntentCheckNode(
    node: FlowNode,
    userInput?: string
  ): Promise<Partial<FlowExecutionResult>> {
    const data = node.data as IntentCheckNodeData

    if (!userInput) {
      return {
        shouldPause: true,
      }
    }

    const userInputLower = userInput.toLowerCase()

    // Check each intent
    for (const intent of data.intents) {
      if (data.use_ai) {
        // In a real implementation, this would use AI intent classification
        // For now, use keyword matching
      }

      // Keyword matching
      if (intent.keywords) {
        const matched = intent.keywords.some((keyword) =>
          userInputLower.includes(keyword.toLowerCase())
        )

        if (matched && intent.next_node) {
          return {
            nextNodeId: intent.next_node,
          }
        }
      }
    }

    // No intent matched
    return {
      nextNodeId: data.default_next_node || this.getNextNodeId(node.id),
    }
  }

  /**
   * Get the next node ID from edges
   */
  private getNextNodeId(currentNodeId: string): string | undefined {
    const edge = this.flow.edges.find((e) => e.source === currentNodeId)
    return edge?.target
  }

  /**
   * Interpolate variables in a string (e.g., "Hello {{user_name}}")
   */
  private interpolateVariables(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      return this.context.variables[varName.trim()] || match
    })
  }

  /**
   * Validate user input against validation rules
   */
  private validateInput(
    input: string,
    validation: QuestionNodeData['validation']
  ): string | null {
    if (!validation) return null

    if (validation.type === 'required' && !input.trim()) {
      return validation.error_message || 'This field is required'
    }

    if (validation.type === 'regex' && validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(input)) {
        return validation.error_message || 'Invalid format'
      }
    }

    if (validation.type === 'min' && validation.min !== undefined) {
      if (input.length < validation.min) {
        return validation.error_message || `Minimum length is ${validation.min}`
      }
    }

    if (validation.type === 'max' && validation.max !== undefined) {
      if (input.length > validation.max) {
        return validation.error_message || `Maximum length is ${validation.max}`
      }
    }

    return null
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(varValue: any, operator: string, compareValue: string): boolean {
    const varStr = String(varValue || '')
    const compareStr = String(compareValue)

    switch (operator) {
      case 'equals':
        return varStr === compareStr
      case 'not_equals':
        return varStr !== compareStr
      case 'contains':
        return varStr.includes(compareStr)
      case 'not_contains':
        return !varStr.includes(compareStr)
      case 'starts_with':
        return varStr.startsWith(compareStr)
      case 'ends_with':
        return varStr.endsWith(compareStr)
      case 'greater_than':
        return parseFloat(varStr) > parseFloat(compareStr)
      case 'less_than':
        return parseFloat(varStr) < parseFloat(compareStr)
      case 'greater_or_equal':
        return parseFloat(varStr) >= parseFloat(compareStr)
      case 'less_or_equal':
        return parseFloat(varStr) <= parseFloat(compareStr)
      case 'is_empty':
        return !varStr || varStr.trim() === ''
      case 'is_not_empty':
        return !!varStr && varStr.trim() !== ''
      default:
        return false
    }
  }
}

/**
 * Helper function to initialize and run a flow
 */
export async function executeFlow(
  flow: ConversationFlow,
  context: FlowExecutionContext,
  userInput?: string
): Promise<FlowExecutionResult> {
  const engine = new FlowExecutionEngine(flow, context)
  return await engine.executeCurrentNode(userInput)
}
