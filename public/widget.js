/**
 * ChatForge AI - Embeddable Widget
 *
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-bot-id="YOUR_BOT_ID"></script>
 */

(function() {
  'use strict';

  // Configuration
  const currentScript = document.currentScript;
  const BOT_ID = currentScript.getAttribute('data-bot-id');
  const API_URL = currentScript.src.replace('/widget.js', '');

  if (!BOT_ID) {
    console.error('ChatForge AI: Missing data-bot-id attribute');
    return;
  }

  // Generate session ID
  function generateSessionId() {
    const stored = localStorage.getItem('chatforge_session_' + BOT_ID);
    if (stored) return stored;

    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    localStorage.setItem('chatforge_session_' + BOT_ID, sessionId);
    return sessionId;
  }

  const SESSION_ID = generateSessionId();

  // Bot configuration
  let botConfig = {
    name: 'ChatBot',
    primary_color: '#6C47FF',
    welcome_message: 'Hi! How can I help you today?',
    placeholder_text: 'Type your message...',
  };

  // State
  let isOpen = false;
  let messages = [];
  let isLoading = false;

  // Fetch bot configuration
  async function fetchBotConfig() {
    try {
      const response = await fetch(`${API_URL}/api/bots/${BOT_ID}/config`);
      if (response.ok) {
        const config = await response.json();
        botConfig = { ...botConfig, ...config };
      }
    } catch (error) {
      console.error('ChatForge AI: Failed to load bot config', error);
    }
  }

  // Send message to API
  async function sendMessage(message) {
    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: BOT_ID,
          message: message,
          sessionId: SESSION_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('ChatForge AI: Error sending message', error);
      throw error;
    }
  }

  // Create styles
  function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #chatforge-widget-container * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }

      #chatforge-widget-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${botConfig.primary_color};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transition: transform 0.2s, box-shadow 0.2s;
        z-index: 9999;
      }

      #chatforge-widget-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      #chatforge-widget-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 9999;
        transform: scale(0);
        transform-origin: bottom right;
        transition: transform 0.2s ease-out;
      }

      #chatforge-widget-window.open {
        transform: scale(1);
      }

      #chatforge-widget-header {
        background-color: ${botConfig.primary_color};
        color: white;
        padding: 20px;
        border-radius: 16px 16px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #chatforge-widget-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      #chatforge-widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      #chatforge-widget-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      #chatforge-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8f8f9;
      }

      .chatforge-message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 12px;
        line-height: 1.5;
        font-size: 14px;
      }

      .chatforge-message.user {
        align-self: flex-end;
        background-color: ${botConfig.primary_color};
        color: white;
        border-bottom-right-radius: 4px;
      }

      .chatforge-message.assistant {
        align-self: flex-start;
        background-color: white;
        color: #1a1a1a;
        border: 1px solid #e5e5e5;
        border-bottom-left-radius: 4px;
      }

      .chatforge-message.loading {
        align-self: flex-start;
        background-color: white;
        border: 1px solid #e5e5e5;
        border-bottom-left-radius: 4px;
      }

      .chatforge-typing-indicator {
        display: flex;
        gap: 4px;
      }

      .chatforge-typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #999;
        animation: chatforge-typing 1.4s infinite;
      }

      .chatforge-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .chatforge-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes chatforge-typing {
        0%, 60%, 100% {
          opacity: 0.3;
          transform: translateY(0);
        }
        30% {
          opacity: 1;
          transform: translateY(-8px);
        }
      }

      #chatforge-widget-input-container {
        padding: 20px;
        border-top: 1px solid #e5e5e5;
        background: white;
        border-radius: 0 0 16px 16px;
      }

      #chatforge-widget-input-form {
        display: flex;
        gap: 8px;
      }

      #chatforge-widget-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e5e5;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      #chatforge-widget-input:focus {
        border-color: ${botConfig.primary_color};
      }

      #chatforge-widget-send {
        background-color: ${botConfig.primary_color};
        color: white;
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      #chatforge-widget-send:hover:not(:disabled) {
        opacity: 0.9;
      }

      #chatforge-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 480px) {
        #chatforge-widget-window {
          width: calc(100vw - 40px);
          bottom: 80px;
        }
      }
    `;
    return style;
  }

  // Create widget HTML
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'chatforge-widget-container';

    container.innerHTML = `
      <button id="chatforge-widget-button" aria-label="Open chat">
        💬
      </button>
      <div id="chatforge-widget-window">
        <div id="chatforge-widget-header">
          <h3>${botConfig.name}</h3>
          <button id="chatforge-widget-close" aria-label="Close chat">×</button>
        </div>
        <div id="chatforge-widget-messages">
          <div class="chatforge-message assistant">
            ${botConfig.welcome_message}
          </div>
        </div>
        <div id="chatforge-widget-input-container">
          <form id="chatforge-widget-input-form">
            <input
              type="text"
              id="chatforge-widget-input"
              placeholder="${botConfig.placeholder_text}"
              autocomplete="off"
            />
            <button type="submit" id="chatforge-widget-send" aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;

    return container;
  }

  // Add message to UI
  function addMessage(content, role) {
    const messagesContainer = document.getElementById('chatforge-widget-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatforge-message ${role}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show loading indicator
  function showLoading() {
    const messagesContainer = document.getElementById('chatforge-widget-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chatforge-message loading';
    loadingDiv.id = 'chatforge-loading';
    loadingDiv.innerHTML = `
      <div class="chatforge-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide loading indicator
  function hideLoading() {
    const loadingDiv = document.getElementById('chatforge-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('chatforge-widget-input');
    const message = input.value.trim();

    if (!message || isLoading) return;

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Show loading
    isLoading = true;
    showLoading();

    try {
      const response = await sendMessage(message);
      hideLoading();
      addMessage(response, 'assistant');
    } catch (error) {
      hideLoading();
      addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
      isLoading = false;
    }
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    const window = document.getElementById('chatforge-widget-window');
    if (isOpen) {
      window.classList.add('open');
    } else {
      window.classList.remove('open');
    }
  }

  // Initialize widget
  async function init() {
    // Fetch configuration
    await fetchBotConfig();

    // Create and inject styles
    const styles = createStyles();
    document.head.appendChild(styles);

    // Create and inject widget
    const widget = createWidget();
    document.body.appendChild(widget);

    // Add event listeners
    document.getElementById('chatforge-widget-button').addEventListener('click', toggleChat);
    document.getElementById('chatforge-widget-close').addEventListener('click', toggleChat);
    document.getElementById('chatforge-widget-input-form').addEventListener('submit', handleSubmit);
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
