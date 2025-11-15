# Widget Customization Guide

Complete guide to customizing the ChatForge AI widget.

---

## Basic Embedding

The simplest way to add ChatForge to your site:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID">
</script>
```

Place this code just before the closing `</body>` tag.

---

## Customization Options

### Position

Control where the widget appears:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-position="bottom-right">
</script>
```

**Options:**
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Colors

The widget automatically uses your bot's primary color, but you can override:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-color="#FF5733">
</script>
```

### Size

Adjust the widget size:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-size="large">
</script>
```

**Options:**
- `small` - Compact widget
- `medium` (default)
- `large` - Expanded widget

### Auto-Open

Automatically open the chat after a delay:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-auto-open="3000">
</script>
```

Value in milliseconds. `3000` = open after 3 seconds.

### Greeting Delay

Show a preview message after page load:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-greeting-delay="2000">
</script>
```

---

## Advanced Customization

### Custom Launcher

Hide the default button and use your own:

```html
<!-- Your custom button -->
<button id="open-chat">Chat with us</button>

<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-launcher="false">
</script>

<script>
  document.getElementById('open-chat').addEventListener('click', () => {
    window.ChatForge.open()
  })
</script>
```

### JavaScript API

Control the widget programmatically:

```javascript
// Open widget
window.ChatForge.open()

// Close widget
window.ChatForge.close()

// Toggle widget
window.ChatForge.toggle()

// Send message programmatically
window.ChatForge.sendMessage('Hello!')

// Listen to events
window.ChatForge.on('open', () => {
  console.log('Widget opened')
})

window.ChatForge.on('close', () => {
  console.log('Widget closed')
})

window.ChatForge.on('message', (data) => {
  console.log('Message sent:', data)
})
```

---

## Styling

### Custom CSS

Override widget styles (advanced):

```css
/* Target the widget container */
#chatforge-widget-window {
  font-family: 'Your Custom Font', sans-serif;
}

/* Customize colors */
.chatforge-message.user {
  background-color: #your-color !important;
}

/* Adjust sizing */
#chatforge-widget-button {
  width: 70px !important;
  height: 70px !important;
}
```

---

## Pre-fill User Data

Pass user information to personalize the experience:

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-user-name="John Doe"
  data-user-email="john@example.com">
</script>
```

---

## Domain Whitelisting

For security, add your domain in the ChatForge dashboard:

1. Go to Bot Settings
2. Navigate to "Allowed Domains"
3. Add your domain (e.g., `example.com`)

The widget will only work on whitelisted domains.

---

## Troubleshooting

### Widget not appearing?

1. Check browser console for errors
2. Verify bot ID is correct
3. Ensure domain is whitelisted
4. Check if bot is active in dashboard

### Widget showing but not responding?

1. Check your OpenAI API key is valid
2. Verify bot has training data
3. Check API logs in dashboard

### Styling issues?

1. Clear browser cache
2. Check for CSS conflicts
3. Use browser DevTools to inspect

---

## Examples

### E-commerce Site

```html
<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-auto-open="5000"
  data-position="bottom-right"
  data-greeting-delay="3000">
</script>
```

### Support Portal

```html
<button onclick="window.ChatForge.open()">
  Need Help? Chat with us
</button>

<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-launcher="false">
</script>
```

### SaaS Dashboard

```html
<script>
  // Open chat when user clicks help icon
  document.querySelector('.help-icon').addEventListener('click', () => {
    window.ChatForge.open()
  })
</script>

<script
  src="https://chatforge.ai/widget.js"
  data-bot-id="YOUR_BOT_ID"
  data-launcher="false"
  data-user-name="<?= $user->name ?>"
  data-user-email="<?= $user->email ?>">
</script>
```

---

## Support

Questions? Contact us:
- Email: support@chatforge.ai
- Docs: https://docs.chatforge.ai
- Community: https://community.chatforge.ai
