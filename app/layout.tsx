import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/lib/providers'

// Using system fonts for reliability
const fontClass = 'font-sans'

export const metadata: Metadata = {
  title: 'ChatForge AI - Build Powerful AI Chatbots in Minutes',
  description: 'ChatForge AI helps your business deliver instant customer support using your data. Create AI chatbots trained on your content with no coding required.',
  keywords: 'AI chatbot, customer support, automation, no-code, business tools',
  authors: [{ name: 'ChatForge AI' }],
  openGraph: {
    title: 'ChatForge AI - Build Powerful AI Chatbots in Minutes',
    description: 'Create AI chatbots trained on your content with no coding required.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontClass}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
