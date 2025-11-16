'use client'

/**
 * Bot Preview Widget
 *
 * Live preview of how the chatbot will look with current settings
 */

import { useState, useEffect, useRef } from 'react'
import { Send, X, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface BotPreviewWidgetProps {
  botConfig: {
    name: string
    welcome_message: string
    placeholder_text: string
    primary_color: string
    avatar_url?: string
  }
  className?: string
  showControls?: boolean
}

export function BotPreviewWidget({
  botConfig,
  className = '',
  showControls = true,
}: BotPreviewWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (botConfig.welcome_message) {
      setMessages([
        {
          role: 'assistant',
          content: botConfig.welcome_message,
          timestamp: new Date(),
        },
      ])
    }
  }, [botConfig.welcome_message])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        role: 'assistant',
        content: 'This is a preview. Connect your bot to see real responses!',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleReset = () => {
    setMessages(
      botConfig.welcome_message
        ? [
            {
              role: 'assistant',
              content: botConfig.welcome_message,
              timestamp: new Date(),
            },
          ]
        : []
    )
    setInput('')
  }

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="rounded-full shadow-lg p-4 flex items-center gap-2 hover:scale-105 transition-transform"
          style={{ backgroundColor: botConfig.primary_color }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-lg">💬</span>
          </div>
          <span className="text-white font-medium pr-2">{botConfig.name}</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col bg-white rounded-lg shadow-xl overflow-hidden ${className}`}
      style={{ height: '600px', width: '100%', maxWidth: '400px' }}
    >
      {/* Header */}
      <div
        className="p-4 text-white flex items-center justify-between"
        style={{ backgroundColor: botConfig.primary_color }}
      >
        <div className="flex items-center gap-3">
          {botConfig.avatar_url ? (
            <img
              src={botConfig.avatar_url}
              alt={botConfig.name}
              className="w-10 h-10 rounded-full bg-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold">{botConfig.name}</h3>
            <p className="text-xs opacity-90">Online</p>
          </div>
        </div>
        {showControls && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Reset conversation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm text-center">
              Start a conversation...
              <br />
              (Preview Mode)
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: botConfig.primary_color }
                      : {}
                  }
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={botConfig.placeholder_text}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4"
            style={{ backgroundColor: botConfig.primary_color }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Preview Mode - Messages are not saved
        </p>
      </div>
    </div>
  )
}
