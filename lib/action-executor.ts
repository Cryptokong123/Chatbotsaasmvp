/**
 * Action Execution Engine
 *
 * Handles webhook action execution with OpenAI function calling
 */

import OpenAI from 'openai'
import { createServerSupabaseClient } from './supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface BotAction {
  id: string
  bot_id: string
  name: string
  display_name: string
  description: string
  webhook_url: string
  method: string
  headers: Record<string, string>
  parameters: ActionParameter[]
  requires_confirmation: boolean
  confirmation_message?: string
  is_active: boolean
}

export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  enum?: string[]
}

export interface ActionExecutionResult {
  success: boolean
  response?: any
  error?: string
  requiresConfirmation?: boolean
  confirmationMessage?: string
  actionId?: string
  parameters?: Record<string, any>
}

/**
 * Convert bot actions to OpenAI function definitions
 */
export function convertActionsToFunctions(actions: BotAction[]): OpenAI.Chat.ChatCompletionTool[] {
  return actions
    .filter((action) => action.is_active)
    .map((action) => ({
      type: 'function' as const,
      function: {
        name: action.name,
        description: action.description,
        parameters: {
          type: 'object',
          properties: action.parameters.reduce(
            (acc, param) => ({
              ...acc,
              [param.name]: {
                type: param.type,
                description: param.description,
                ...(param.enum && { enum: param.enum }),
              },
            }),
            {}
          ),
          required: action.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    }))
}

/**
 * Execute a webhook action
 */
export async function executeWebhook(
  action: BotAction,
  parameters: Record<string, any>
): Promise<{
  success: boolean
  response?: any
  error?: string
  httpStatus?: number
  executionTimeMs?: number
}> {
  const startTime = Date.now()

  try {
    // Build request body/query based on method
    const options: RequestInit = {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers,
      },
    }

    let url = action.webhook_url

    if (action.method === 'GET') {
      // Append parameters as query string
      const queryString = new URLSearchParams(
        Object.entries(parameters).map(([k, v]) => [k, String(v)])
      ).toString()
      url = `${url}?${queryString}`
    } else {
      // Include parameters in body
      options.body = JSON.stringify(parameters)
    }

    const response = await fetch(url, options)
    const executionTimeMs = Date.now() - startTime

    let responseData
    try {
      responseData = await response.json()
    } catch {
      responseData = await response.text()
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
        executionTimeMs,
      }
    }

    return {
      success: true,
      response: responseData,
      httpStatus: response.status,
      executionTimeMs,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to execute webhook',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

/**
 * Handle OpenAI function calling with actions
 */
export async function processWithActions(
  botId: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemInstructions: string
): Promise<{
  response: string
  actionExecuted?: boolean
  actionResult?: any
  requiresConfirmation?: boolean
  confirmationData?: {
    actionId: string
    actionName: string
    parameters: Record<string, any>
    message: string
  }
}> {
  const supabase = createServerSupabaseClient()

  // Fetch available actions for this bot
  const { data: actions, error: actionsError } = await supabase
    .from('bot_actions')
    .select('*')
    .eq('bot_id', botId)
    .eq('is_active', true)

  if (actionsError || !actions || actions.length === 0) {
    // No actions available, return without function calling
    return { response: '', actionExecuted: false }
  }

  // Convert actions to OpenAI function definitions
  const tools = convertActionsToFunctions(actions as BotAction[])

  // Build messages for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemInstructions },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ]

  try {
    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto',
    })

    const responseMessage = completion.choices[0].message

    // Check if AI wants to call a function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)

      // Find the matching action
      const action = actions.find((a) => a.name === functionName) as BotAction | undefined

      if (!action) {
        return {
          response: "I'm sorry, I encountered an error trying to perform that action.",
          actionExecuted: false,
        }
      }

      // Check if confirmation is required
      if (action.requires_confirmation) {
        const confirmMessage =
          action.confirmation_message ||
          `Are you sure you want to ${action.display_name.toLowerCase()}?`

        return {
          response: confirmMessage,
          requiresConfirmation: true,
          confirmationData: {
            actionId: action.id,
            actionName: action.name,
            parameters: functionArgs,
            message: confirmMessage,
          },
        }
      }

      // Execute the action immediately (no confirmation needed)
      const result = await executeWebhook(action, functionArgs)

      if (result.success) {
        // Ask AI to format the success response
        const successCompletion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            ...messages,
            responseMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result.response),
            },
          ],
        })

        return {
          response: successCompletion.choices[0].message.content || 'Action completed successfully.',
          actionExecuted: true,
          actionResult: result.response,
        }
      } else {
        return {
          response: `I encountered an error: ${result.error}`,
          actionExecuted: false,
        }
      }
    }

    // No function call, return normal response
    return {
      response: responseMessage.content || '',
      actionExecuted: false,
    }
  } catch (error: any) {
    console.error('Error in processWithActions:', error)
    return {
      response: "I'm sorry, I encountered an error processing your request.",
      actionExecuted: false,
    }
  }
}

/**
 * Execute a confirmed action
 */
export async function executeConfirmedAction(
  actionId: string,
  parameters: Record<string, any>,
  sessionId: string
): Promise<{
  success: boolean
  response: string
  executionResult?: any
}> {
  const supabase = createServerSupabaseClient()

  // Fetch the action
  const { data: action, error: actionError } = await supabase
    .from('bot_actions')
    .select('*')
    .eq('id', actionId)
    .single()

  if (actionError || !action) {
    return {
      success: false,
      response: 'Action not found.',
    }
  }

  // Execute the webhook
  const result = await executeWebhook(action as BotAction, parameters)

  // Log the execution
  await supabase.from('action_logs').insert({
    action_id: actionId,
    bot_id: action.bot_id,
    session_id: sessionId,
    status: result.success ? 'executed' : 'failed',
    request_payload: parameters,
    response_payload: result.response,
    http_status: result.httpStatus,
    error_message: result.error,
    execution_time_ms: result.executionTimeMs,
    executed_at: new Date().toISOString(),
  })

  if (result.success) {
    return {
      success: true,
      response: 'Action completed successfully!',
      executionResult: result.response,
    }
  } else {
    return {
      success: false,
      response: `Action failed: ${result.error}`,
    }
  }
}
