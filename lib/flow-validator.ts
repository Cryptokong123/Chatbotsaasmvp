/**
 * Flow Validation System
 *
 * Validates conversation flows for errors and warnings
 */

import type { ConversationFlow, FlowNode, FlowEdge } from '@/types/flow'

export interface ValidationIssue {
  type: 'error' | 'warning'
  nodeId?: string
  message: string
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

/**
 * Validate a complete conversation flow
 */
export function validateFlow(flow: ConversationFlow): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  // 1. Check for at least one start node
  const startNodes = flow.nodes.filter((n) => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push({
      type: 'error',
      message: 'Flow must have at least one Start node',
      suggestion: 'Add a Start node from the node palette',
    })
  } else if (startNodes.length > 1) {
    warnings.push({
      type: 'warning',
      message: 'Flow has multiple Start nodes',
      suggestion: 'Consider using only one Start node per flow',
    })
  }

  // 2. Check entry node exists
  if (flow.entry_node_id) {
    const entryNode = flow.nodes.find((n) => n.id === flow.entry_node_id)
    if (!entryNode) {
      errors.push({
        type: 'error',
        message: 'Entry node not found in flow',
        suggestion: 'Set a valid entry node',
      })
    }
  } else if (flow.nodes.length > 0) {
    warnings.push({
      type: 'warning',
      message: 'No entry node specified',
      suggestion: 'Set an entry node to define where the flow starts',
    })
  }

  // 3. Check for orphaned nodes (nodes with no connections)
  if (flow.nodes.length > 1) {
    const orphanedNodes = findOrphanedNodes(flow.nodes, flow.edges)
    orphanedNodes.forEach((node) => {
      warnings.push({
        type: 'warning',
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" is not connected`,
        suggestion: 'Connect this node or remove it from the flow',
      })
    })
  }

  // 4. Validate individual nodes
  flow.nodes.forEach((node) => {
    const nodeIssues = validateNode(node, flow)
    errors.push(...nodeIssues.filter((i) => i.type === 'error'))
    warnings.push(...nodeIssues.filter((i) => i.type === 'warning'))
  })

  // 5. Check for circular dependencies
  const cycles = detectCycles(flow.nodes, flow.edges)
  if (cycles.length > 0) {
    warnings.push({
      type: 'warning',
      message: `Flow contains ${cycles.length} circular path(s)`,
      suggestion: 'Circular flows may cause infinite loops - ensure you have exit conditions',
    })
  }

  // 6. Check for unreachable nodes
  if (flow.entry_node_id) {
    const reachable = findReachableNodes(flow.entry_node_id, flow.edges)
    const unreachable = flow.nodes.filter(
      (n) => n.id !== flow.entry_node_id && !reachable.has(n.id)
    )
    unreachable.forEach((node) => {
      warnings.push({
        type: 'warning',
        nodeId: node.id,
        message: `Node "${node.data?.label || node.id}" is unreachable from entry point`,
        suggestion: 'This node will never execute - connect it or remove it',
      })
    })
  }

  // 7. Check for dead ends (nodes with no outgoing edges, except End nodes)
  flow.nodes.forEach((node) => {
    if (node.type !== 'end' && node.type !== 'handoff') {
      const hasOutgoing = flow.edges.some((e) => e.source === node.id)
      if (!hasOutgoing) {
        warnings.push({
          type: 'warning',
          nodeId: node.id,
          message: `Node "${node.data?.label || node.id}" has no outgoing connection`,
          suggestion: 'Connect this node to another or change it to an End node',
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate an individual node
 */
function validateNode(node: FlowNode, flow: ConversationFlow): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  switch (node.type) {
    case 'message':
      if (!(node.data as any).message || (node.data as any).message.trim() === '') {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Message node "${node.data?.label || node.id}" has no message`,
          suggestion: 'Add a message to display',
        })
      }
      break

    case 'question':
      if (!(node.data as any).question || (node.data as any).question.trim() === '') {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Question node "${node.data?.label || node.id}" has no question`,
          suggestion: 'Add a question to ask',
        })
      }
      if (!(node.data as any).variable_name || (node.data as any).variable_name.trim() === '') {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Question node "${node.data?.label || node.id}" has no variable name`,
          suggestion: 'Specify a variable name to store the answer',
        })
      }
      // Check for duplicate variable names
      const duplicateVars = flow.nodes.filter(
        (n) =>
          n.type === 'question' &&
          n.id !== node.id &&
          (n.data as any).variable_name === (node.data as any).variable_name
      )
      if (duplicateVars.length > 0) {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `Variable "${(node.data as any).variable_name}" is used in multiple question nodes`,
          suggestion: 'This will overwrite previous values - use unique variable names',
        })
      }
      break

    case 'condition':
      if (!(node.data as any).conditions || (node.data as any).conditions.length === 0) {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Condition node "${node.data?.label || node.id}" has no conditions`,
          suggestion: 'Add at least one condition to evaluate',
        })
      }
      // Check that condition variables exist
      (node.data as any).conditions?.forEach((condition: any, index: number) => {
        if (!condition.variable) {
          issues.push({
            type: 'error',
            nodeId: node.id,
            message: `Condition ${index + 1} has no variable specified`,
            suggestion: 'Select a variable to check',
          })
        }
      })
      break

    case 'api_call':
      if (!(node.data as any).url || (node.data as any).url.trim() === '') {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `API Call node "${node.data?.label || node.id}" has no URL`,
          suggestion: 'Add an API endpoint URL',
        })
      } else {
        // Validate URL format
        try {
          if ((node.data as any).url.includes('{{')) {
            // Has variable interpolation - can't validate yet
          } else {
            new URL((node.data as any).url)
          }
        } catch {
          issues.push({
            type: 'warning',
            nodeId: node.id,
            message: `API Call URL may be invalid`,
            suggestion: 'Check that the URL is properly formatted',
          })
        }
      }
      if (!(node.data as any).store_response_in || (node.data as any).store_response_in.trim() === '') {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `API Call response is not being stored`,
          suggestion: 'Specify a variable to store the API response',
        })
      }
      break

    case 'set_variable':
      if (!(node.data as any).variable_name || (node.data as any).variable_name.trim() === '') {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Set Variable node "${node.data?.label || node.id}" has no variable name`,
          suggestion: 'Specify which variable to set',
        })
      }
      if ((node.data as any).value === undefined || (node.data as any).value === '') {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `Set Variable node is setting an empty value`,
          suggestion: 'Specify a value to set',
        })
      }
      break

    case 'form':
      if (!(node.data as any).fields || (node.data as any).fields.length === 0) {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `Form node "${node.data?.label || node.id}" has no fields`,
          suggestion: 'Add fields to collect information',
        })
      }
      break

    case 'handoff':
      if (!(node.data as any).message || (node.data as any).message.trim() === '') {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `Handoff node has no message`,
          suggestion: 'Add a message to show before handoff',
        })
      }
      break

    case 'intent_check':
      if (!(node.data as any).intents || (node.data as any).intents.length === 0) {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Intent Check node "${node.data?.label || node.id}" has no intents`,
          suggestion: 'Add intents to detect',
        })
      }
      break
  }

  return issues
}

/**
 * Find nodes that are not connected to anything
 */
function findOrphanedNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  return nodes.filter((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id)
    const hasOutgoing = edges.some((e) => e.source === node.id)
    return !hasIncoming && !hasOutgoing && node.type !== 'start'
  })
}

/**
 * Detect circular dependencies in the flow
 */
function detectCycles(nodes: FlowNode[], edges: FlowEdge[]): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    path.push(nodeId)

    const outgoingEdges = edges.filter((e) => e.source === nodeId)
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target, [...path])) {
          return true
        }
      } else if (recursionStack.has(edge.target)) {
        // Found a cycle
        const cycleStart = path.indexOf(edge.target)
        cycles.push([...path.slice(cycleStart), edge.target])
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, [])
    }
  }

  return cycles
}

/**
 * Find all nodes reachable from a starting node
 */
function findReachableNodes(startNodeId: string, edges: FlowEdge[]): Set<string> {
  const reachable = new Set<string>()
  const queue = [startNodeId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (reachable.has(current)) continue

    reachable.add(current)

    const outgoing = edges.filter((e) => e.source === current)
    for (const edge of outgoing) {
      if (!reachable.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  }

  return reachable
}

/**
 * Quick validation - just check for critical errors
 */
export function hasValidationErrors(flow: ConversationFlow): boolean {
  const result = validateFlow(flow)
  return !result.isValid
}

/**
 * Get validation summary string
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Flow is valid with no issues'
  }

  const parts: string[] = []
  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s)`)
  }
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`)
  }

  return parts.join(', ')
}
