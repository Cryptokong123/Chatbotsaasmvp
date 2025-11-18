import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, ArrowLeft, Mail } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white">
      <nav className="relative bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-white" />
              <span className="text-lg font-bold">ChatForge AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>

        <h1 className="text-5xl font-bold mb-6">Contact Us</h1>
        <p className="text-xl text-gray-400 mb-12">
          We'd love to hear from you. Get in touch with our team.
        </p>

        <div className="grid gap-6">
          <div className="bg-white/5 rounded-lg p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">General Inquiries</h2>
                <p className="text-gray-400 mb-3">
                  For general questions and support
                </p>
                <a href="mailto:hello@chatforge.ai" className="text-white hover:underline text-lg">
                  hello@chatforge.ai
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Sales</h2>
                <p className="text-gray-400 mb-3">
                  Interested in enterprise plans?
                </p>
                <a href="mailto:sales@chatforge.ai" className="text-white hover:underline text-lg">
                  sales@chatforge.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
