'use client'

/**
 * Base Flow Node Component
 *
 * Shared layout and styling for all flow nodes
 */

import { Handle, Position, NodeProps } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface BaseFlowNodeProps {
  icon: LucideIcon
  title: string
  color: string
  children?: ReactNode
  handles?: {
    source?: boolean
    target?: boolean
    sourcePosition?: Position
    targetPosition?: Position
  }
}

export function BaseFlowNode({
  icon: Icon,
  title,
  color,
  children,
  handles = { source: true, target: true },
}: BaseFlowNodeProps) {
  return (
    <div className="min-w-[220px] bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
      {handles.target && (
        <Handle
          type="target"
          position={handles.targetPosition || Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}

      <div
        className="px-4 py-2 rounded-t-md flex items-center gap-2"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4 text-white" />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>

      <div className="p-3 text-sm">{children}</div>

      {handles.source && (
        <Handle
          type="source"
          position={handles.sourcePosition || Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
    </div>
  )
}

// Reusable field display component
export function NodeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900 font-medium truncate" title={value}>
        {value}
      </div>
    </div>
  )
}

// Badge component for node status/type
export function NodeBadge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' }) {
  const colors = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  )
}
