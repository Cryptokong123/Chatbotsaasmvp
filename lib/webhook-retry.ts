/**
 * Execute webhook with retry logic and exponential backoff
 * 
 * @param url - Webhook URL to call
 * @param payload - Data to send
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Object with success status, response, or error message
 */
export async function executeWebhookWithRetry(
  url: string,
  payload: any,
  maxRetries: number = 3
): Promise<{ success: boolean; response?: any; error?: string; attempts: number }> {
  let lastError: string = ''
  let attempts = 0

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChatForge-AI-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Success - webhook returned 2xx status
      if (response.ok) {
        let responseData
        try {
          responseData = await response.json()
        } catch {
          responseData = { status: 'success' }
        }
        
        return {
          success: true,
          response: responseData,
          attempts,
        }
      }

      // Client error (4xx) - don't retry
      if (response.status >= 400 && response.status < 500) {
        lastError = `HTTP ${response.status}: ${response.statusText}`
        
        // Don't retry on client errors
        return {
          success: false,
          error: `Webhook failed with client error: ${lastError}. Please check your webhook configuration.`,
          attempts,
        }
      }

      // Server error (5xx) - retry
      lastError = `HTTP ${response.status}: ${response.statusText}`
    } catch (error: any) {
      // Network error or timeout - retry
      if (error.name === 'AbortError') {
        lastError = 'Request timeout (10s)'
      } else {
        lastError = error.message || 'Network error'
      }
    }

    // If not the last attempt, wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // All retries failed
  return {
    success: false,
    error: `Webhook failed after ${maxRetries} attempts. Last error: ${lastError}`,
    attempts,
  }
}

/**
 * Verify webhook signature (HMAC-SHA256)
 * 
 * @param payload - Request body as string
 * @param signature - Signature from header
 * @param secret - Webhook secret key
 * @returns True if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}
