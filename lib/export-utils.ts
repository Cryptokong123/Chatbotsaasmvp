/**
 * Export utilities for conversations
 */

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Conversation {
  sessionId: string
  botId: string
  botName: string
  messages: Message[]
  startedAt: string
  lastMessageAt: string
  messageCount: number
  tags?: string[]
  notes?: string
}

/**
 * Export conversations to CSV format
 */
export function exportToCSV(conversations: Conversation[]): string {
  const headers = [
    'Session ID',
    'Bot Name',
    'Started At',
    'Last Message At',
    'Message Count',
    'Role',
    'Message',
    'Timestamp',
    'Tags',
    'Notes',
  ]

  const rows: string[][] = [headers]

  conversations.forEach((conv) => {
    conv.messages.forEach((msg, index) => {
      rows.push([
        index === 0 ? conv.sessionId : '', // Only show session ID on first message
        index === 0 ? conv.botName : '',
        index === 0 ? new Date(conv.startedAt).toLocaleString() : '',
        index === 0 ? new Date(conv.lastMessageAt).toLocaleString() : '',
        index === 0 ? conv.messageCount.toString() : '',
        msg.role,
        msg.content.replace(/"/g, '""'), // Escape quotes
        new Date(msg.createdAt).toLocaleString(),
        index === 0 ? (conv.tags?.join('; ') || '') : '',
        index === 0 ? (conv.notes || '') : '',
      ])
    })
  })

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Export conversations to JSON format
 */
export function exportToJSON(conversations: Conversation[]): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalConversations: conversations.length,
    totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
    conversations: conversations.map((conv) => ({
      sessionId: conv.sessionId,
      botId: conv.botId,
      botName: conv.botName,
      startedAt: conv.startedAt,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv.messageCount,
      tags: conv.tags || [],
      notes: conv.notes || '',
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(format: 'csv' | 'json', prefix: string = 'conversations'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${prefix}_${timestamp}.${format}`
}
