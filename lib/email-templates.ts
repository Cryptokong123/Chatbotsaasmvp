// Email template system for ChatForge AI

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface NewConversationData {
  botName: string
  userMessage: string
  sessionId: string
  conversationUrl: string
}

interface NegativeRatingData {
  botName: string
  rating: number
  feedback?: string
  conversationUrl: string
  userMessage: string
}

interface DailySummaryData {
  date: string
  totalConversations: number
  totalMessages: number
  averageResponseTime: string
  satisfactionScore: number
  topQuestions: string[]
  dashboardUrl: string
}

interface TeamMentionData {
  mentionedBy: string
  conversationUrl: string
  message: string
  botName: string
}

const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background: #5568d3;
    }
    .card {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
  </style>
`

export function newConversationEmail(data: NewConversationData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Conversation Started</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>A new conversation has started on your bot <strong>${data.botName}</strong>.</p>

          <div class="card">
            <strong>First Message:</strong>
            <p style="margin: 10px 0 0 0;">${data.userMessage}</p>
          </div>

          <p>
            <a href="${data.conversationUrl}" class="button">View Conversation</a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Session ID: ${data.sessionId}
          </p>
        </div>
        <div class="footer">
          <p>ChatForge AI • <a href="https://chatforge.ai">Dashboard</a> • <a href="https://chatforge.ai/settings/notifications">Notification Settings</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
New Conversation Started

A new conversation has started on your bot "${data.botName}".

First Message: ${data.userMessage}

View conversation: ${data.conversationUrl}
Session ID: ${data.sessionId}

---
ChatForge AI
  `

  return {
    subject: `New conversation on ${data.botName}`,
    html,
    text,
  }
}

export function negativeRatingEmail(data: NegativeRatingData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <h1>👎 Negative Feedback Received</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Your bot <strong>${data.botName}</strong> received a negative rating.</p>

          <div class="card" style="border-left-color: #f5576c;">
            <strong>User's Message:</strong>
            <p style="margin: 10px 0;">${data.userMessage}</p>
            ${data.feedback ? `<strong>Feedback:</strong><p style="margin: 10px 0;">"${data.feedback}"</p>` : ''}
          </div>

          <p>
            <a href="${data.conversationUrl}" class="button" style="background: #f5576c;">Review Conversation</a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Use this feedback to improve your bot's responses and training data.
          </p>
        </div>
        <div class="footer">
          <p>ChatForge AI • <a href="https://chatforge.ai">Dashboard</a> • <a href="https://chatforge.ai/settings/notifications">Notification Settings</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Negative Feedback Received

Your bot "${data.botName}" received a negative rating.

User's Message: ${data.userMessage}
${data.feedback ? `Feedback: "${data.feedback}"` : ''}

Review conversation: ${data.conversationUrl}

Use this feedback to improve your bot's responses and training data.

---
ChatForge AI
  `

  return {
    subject: `⚠️ Negative feedback on ${data.botName}`,
    html,
    text,
  }
}

export function dailySummaryEmail(data: DailySummaryData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #4338ca 100%);">
          <h1>📊 Daily Summary</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.date}</p>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Here's your daily summary of bot activity:</p>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${data.totalConversations}</div>
              <div class="stat-label">Conversations</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.totalMessages}</div>
              <div class="stat-label">Messages</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.satisfactionScore}%</div>
              <div class="stat-label">Satisfaction</div>
            </div>
          </div>

          <div class="card">
            <strong>Average Response Time:</strong> ${data.averageResponseTime}
          </div>

          ${data.topQuestions.length > 0 ? `
            <div class="card">
              <strong>Top Questions:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                ${data.topQuestions.map(q => `<li>${q}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <p>
            <a href="${data.dashboardUrl}" class="button">View Full Analytics</a>
          </p>
        </div>
        <div class="footer">
          <p>ChatForge AI • <a href="https://chatforge.ai">Dashboard</a> • <a href="https://chatforge.ai/settings/notifications">Notification Settings</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Daily Summary - ${data.date}

Your bot activity summary:

Conversations: ${data.totalConversations}
Messages: ${data.totalMessages}
Satisfaction: ${data.satisfactionScore}%
Avg Response Time: ${data.averageResponseTime}

${data.topQuestions.length > 0 ? `
Top Questions:
${data.topQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
` : ''}

View full analytics: ${data.dashboardUrl}

---
ChatForge AI
  `

  return {
    subject: `📊 Daily Summary - ${data.date}`,
    html,
    text,
  }
}

export function teamMentionEmail(data: TeamMentionData): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <h1>@ You were mentioned</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${data.mentionedBy}</strong> mentioned you in a conversation on <strong>${data.botName}</strong>.</p>

          <div class="card">
            <p style="margin: 0;">${data.message}</p>
          </div>

          <p>
            <a href="${data.conversationUrl}" class="button">View Conversation</a>
          </p>
        </div>
        <div class="footer">
          <p>ChatForge AI • <a href="https://chatforge.ai">Dashboard</a> • <a href="https://chatforge.ai/settings/notifications">Notification Settings</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
You were mentioned

${data.mentionedBy} mentioned you in a conversation on "${data.botName}".

Message: ${data.message}

View conversation: ${data.conversationUrl}

---
ChatForge AI
  `

  return {
    subject: `${data.mentionedBy} mentioned you`,
    html,
    text,
  }
}
