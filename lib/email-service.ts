// Email service for sending notifications
// Using Resend API (https://resend.com)

import { createServerSupabaseClient } from './supabase'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
  userId: string
  type: string
  metadata?: Record<string, any>
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, text, userId, type, metadata = {} } = params

  // Check if user has email notifications enabled
  const supabase = createServerSupabaseClient()
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_enabled')
    .eq('user_id', userId)
    .single()

  if (!prefs?.email_enabled) {
    console.log(`Email notifications disabled for user ${userId}`)
    return false
  }

  try {
    // Log the notification attempt
    const { error: logError } = await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        type,
        subject,
        body: text,
        recipient_email: to,
        status: 'pending',
        metadata,
      })

    if (logError) {
      console.error('Error logging notification:', logError)
    }

    // Send email using Resend API
    // NOTE: You need to set RESEND_API_KEY environment variable
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, email not sent')
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', { to, subject })
        console.log('HTML Preview:', html.substring(0, 200) + '...')
        return true
      }
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'ChatForge AI <noreply@chatforge.ai>',
        to,
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    // Update notification log as sent
    await supabase
      .from('notification_log')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    console.log(`✅ Email sent successfully to ${to}`)
    return true
  } catch (error: any) {
    console.error('Error sending email:', error)

    // Log the error
    await supabase
      .from('notification_log')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    return false
  }
}

// Helper function to check if a specific notification type is enabled
export async function isNotificationEnabled(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('email_enabled, ' + notificationType + '_enabled')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false

  return (data as any).email_enabled && (data as any)[notificationType + '_enabled']
}

// Send notification only if enabled
export async function sendNotificationIfEnabled(
  userId: string,
  notificationType: string,
  emailData: SendEmailParams
): Promise<boolean> {
  const enabled = await isNotificationEnabled(userId, notificationType)

  if (!enabled) {
    console.log(`Notification type ${notificationType} disabled for user ${userId}`)
    return false
  }

  return await sendEmail(emailData)
}
