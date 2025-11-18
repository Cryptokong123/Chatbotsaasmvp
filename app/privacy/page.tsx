import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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

        <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-xl text-gray-400 mb-12">
          Your privacy is important to us. Our full privacy policy is being finalized.
        </p>

        <div className="bg-white/5 rounded-lg p-8 backdrop-blur-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-3">Data Protection</h2>
            <p className="text-gray-400">
              We take data protection seriously and follow industry best practices to keep your information secure.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
            <p className="text-gray-400">
              For privacy-related questions, please contact us at{' '}
              <a href="mailto:privacy@chatforge.ai" className="text-white hover:underline">
                privacy@chatforge.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
