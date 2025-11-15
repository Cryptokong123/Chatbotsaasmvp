'use client'

import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquare, ThumbsDown, AlertCircle, Calendar, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

interface NotificationPreferences {
  email_enabled: boolean
  new_conversation_enabled: boolean
  negative_rating_enabled: boolean
  bot_offline_enabled: boolean
  daily_summary_enabled: boolean
  weekly_report_enabled: boolean
  team_mention_enabled: boolean
  assignment_enabled: boolean
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_enabled: true,
    new_conversation_enabled: true,
    negative_rating_enabled: true,
    bot_offline_enabled: true,
    daily_summary_enabled: false,
    weekly_report_enabled: true,
    team_mention_enabled: true,
    assignment_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/preferences')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences')
      }

      setPrefs(data.preferences)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    // Optimistic update
    setPrefs(prev => ({ ...prev, [key]: value }))

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update preferences')
      }

      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      })
    } catch (error: any) {
      // Revert on error
      setPrefs(prev => ({ ...prev, [key]: !value }))
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Manage how and when you receive notifications from ChatForge AI
        </p>
      </div>

      {/* Master Switch */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Master toggle for all email notifications</CardDescription>
              </div>
            </div>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Notification Categories */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <CardTitle>Instant Notifications</CardTitle>
          </div>
          <CardDescription>Receive immediate notifications for important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <Label htmlFor="new-conversation" className="text-base font-medium cursor-pointer">
                  New Conversations
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when a new conversation starts on any of your bots
                </p>
              </div>
            </div>
            <Switch
              id="new-conversation"
              checked={prefs.new_conversation_enabled}
              onCheckedChange={(checked) => updatePreference('new_conversation_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ThumbsDown className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <Label htmlFor="negative-rating" className="text-base font-medium cursor-pointer">
                  Negative Ratings
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get alerted when users give negative feedback to your bots
                </p>
              </div>
            </div>
            <Switch
              id="negative-rating"
              checked={prefs.negative_rating_enabled}
              onCheckedChange={(checked) => updatePreference('negative_rating_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-1" />
              <div>
                <Label htmlFor="bot-offline" className="text-base font-medium cursor-pointer">
                  Bot Status Alerts
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified if your bot goes offline or encounters errors
                </p>
              </div>
            </div>
            <Switch
              id="bot-offline"
              checked={prefs.bot_offline_enabled}
              onCheckedChange={(checked) => updatePreference('bot_offline_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <CardTitle>Digest Notifications</CardTitle>
          </div>
          <CardDescription>Periodic summaries of your bot activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <Label htmlFor="daily-summary" className="text-base font-medium cursor-pointer">
                  Daily Summary
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive a daily email with conversation stats and highlights (sent at 9 AM)
                </p>
              </div>
            </div>
            <Switch
              id="daily-summary"
              checked={prefs.daily_summary_enabled}
              onCheckedChange={(checked) => updatePreference('daily_summary_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <Label htmlFor="weekly-report" className="text-base font-medium cursor-pointer">
                  Weekly Report
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Comprehensive weekly analytics report (sent every Monday)
                </p>
              </div>
            </div>
            <Switch
              id="weekly-report"
              checked={prefs.weekly_report_enabled}
              onCheckedChange={(checked) => updatePreference('weekly_report_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle>Team Collaboration</CardTitle>
          </div>
          <CardDescription>Notifications related to team activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-pink-500 mt-1" />
              <div>
                <Label htmlFor="team-mention" className="text-base font-medium cursor-pointer">
                  Team Mentions
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when someone mentions you in a conversation
                </p>
              </div>
            </div>
            <Switch
              id="team-mention"
              checked={prefs.team_mention_enabled}
              onCheckedChange={(checked) => updatePreference('team_mention_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 text-cyan-500 mt-1" />
              <div>
                <Label htmlFor="assignment" className="text-base font-medium cursor-pointer">
                  Conversation Assignments
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when a conversation is assigned to you
                </p>
              </div>
            </div>
            <Switch
              id="assignment"
              checked={prefs.assignment_enabled}
              onCheckedChange={(checked) => updatePreference('assignment_enabled', checked)}
              disabled={!prefs.email_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Bell className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Notification Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Instant notifications help you respond quickly to customer needs</li>
              <li>• Daily summaries keep you updated without overwhelming your inbox</li>
              <li>• You can always adjust these settings based on your workflow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
