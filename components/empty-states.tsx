import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Bot, MessageSquare, Users, Key, FileText, Search, Inbox, Sparkles, Zap, Globe } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="text-center py-12">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
        {(action || secondaryAction) && (
          <div className="flex gap-3 justify-center">
            {action && (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NoBotsEmpty({ onCreateBot, onCreateAgent }: { onCreateBot: () => void; onCreateAgent?: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
          <Bot className="h-16 w-16 text-primary relative" />
        </div>
      }
      title="No bots or agents yet"
      description="Create your first AI chatbot or autonomous agent to start engaging with your customers. It only takes a minute to set up!"
      action={{
        label: 'Create Chatbot',
        onClick: onCreateBot,
      }}
      secondaryAction={onCreateAgent ? {
        label: 'Create Agent',
        onClick: onCreateAgent,
      } : undefined}
    />
  )
}

export function NoConversationsEmpty({ hasFilters, onClearFilters }: { hasFilters?: boolean; onClearFilters?: () => void }) {
  if (hasFilters && onClearFilters) {
    return (
      <EmptyState
        icon={<Search className="h-16 w-16 text-gray-400" />}
        title="No conversations found"
        description="Try adjusting your search filters or criteria to find what you're looking for."
        action={{
          label: 'Clear Filters',
          onClick: onClearFilters,
        }}
      />
    )
  }

  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl"></div>
          <MessageSquare className="h-16 w-16 text-purple-500 relative" />
        </div>
      }
      title="No conversations yet"
      description="Conversations will appear here once users start chatting with your bots. Make sure your widget is properly embedded on your website."
      secondaryAction={{
        label: 'View Embed Code',
        onClick: () => window.location.href = '/dashboard',
      }}
    />
  )
}

export function NoTeamMembersEmpty({ onInviteMember }: { onInviteMember: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl"></div>
          <Users className="h-16 w-16 text-blue-500 relative" />
        </div>
      }
      title="Build your team"
      description="Collaborate with your team by inviting members. Assign roles and permissions to manage access effectively."
      action={{
        label: 'Invite Team Member',
        onClick: onInviteMember,
      }}
    />
  )
}

export function NoApiKeysEmpty({ onCreateKey }: { onCreateKey: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-amber-100 rounded-full blur-xl"></div>
          <Key className="h-16 w-16 text-amber-500 relative" />
        </div>
      }
      title="No API keys yet"
      description="Create your first API key to start integrating ChatForge with your external systems and applications."
      action={{
        label: 'Create API Key',
        onClick: onCreateKey,
      }}
    />
  )
}

export function NoTrainingDataEmpty({ onUploadData }: { onUploadData: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-green-100 rounded-full blur-xl"></div>
          <FileText className="h-16 w-16 text-green-500 relative" />
        </div>
      }
      title="No training data"
      description="Upload documents, FAQs, or knowledge base content to train your bot and improve its responses."
      action={{
        label: 'Upload Training Data',
        onClick: onUploadData,
      }}
      secondaryAction={{
        label: 'Learn More',
        onClick: () => window.open('https://docs.example.com/training', '_blank'),
      }}
    />
  )
}

export function NoSearchResultsEmpty({ searchTerm, onClearSearch }: { searchTerm?: string; onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16 text-gray-400" />}
      title="No results found"
      description={searchTerm ? `No results for "${searchTerm}". Try different keywords or check your spelling.` : 'No results found. Try adjusting your search criteria.'}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
      }}
    />
  )
}

export function NoAnalyticsEmpty() {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl"></div>
          <Sparkles className="h-16 w-16 text-indigo-500 relative" />
        </div>
      }
      title="Not enough data yet"
      description="Analytics will appear once you have more conversations. Start chatting with your bot to see insights!"
    />
  )
}

export function NoIntegrationsEmpty({ onBrowseIntegrations }: { onBrowseIntegrations: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-pink-100 rounded-full blur-xl"></div>
          <Zap className="h-16 w-16 text-pink-500 relative" />
        </div>
      }
      title="No integrations configured"
      description="Connect ChatForge with your favorite tools like Slack, WhatsApp, Zendesk, and more to streamline your workflow."
      action={{
        label: 'Browse Integrations',
        onClick: onBrowseIntegrations,
      }}
    />
  )
}

export function NoTemplatesEmpty({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-100 rounded-full blur-xl"></div>
          <Globe className="h-16 w-16 text-cyan-500 relative" />
        </div>
      }
      title="No templates saved"
      description="Create reusable bot templates to quickly launch new bots with pre-configured settings and training data."
      action={{
        label: 'Create Template',
        onClick: onCreateTemplate,
      }}
    />
  )
}

export function ErrorState({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
        <p className="text-red-700 mb-6 max-w-md mx-auto">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
