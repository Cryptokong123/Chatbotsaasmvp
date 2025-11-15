import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/lib/providers'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
