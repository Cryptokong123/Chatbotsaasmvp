import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Zap, Globe, BarChart } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">ChatForge AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Build powerful AI chatbots
            <span className="block text-primary">in minutes</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            ChatForge AI helps your business deliver instant customer support using your data.
            No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Building for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to power customer conversations
            </h2>
            <p className="text-xl text-gray-600">
              Built for businesses that value their customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Train on Your Data</h3>
              <p className="text-gray-600">
                Upload PDFs, paste text, or add FAQs. Your bot learns from your content.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Responses</h3>
              <p className="text-gray-600">
                Powered by GPT-4, your bot provides accurate answers instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No-Code Embed</h3>
              <p className="text-gray-600">
                Add to your website with a single line of code. Works anywhere.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Bot Support</h3>
              <p className="text-gray-600">
                Create multiple bots for different use cases or departments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get started in 3 simple steps
            </h2>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="text-primary font-bold text-lg mb-2">Step 1</div>
                <h3 className="text-2xl font-bold mb-4">Create Your Bot</h3>
                <p className="text-gray-600 text-lg">
                  Sign up and create your first chatbot in seconds. Customize its name, appearance,
                  and behavior to match your brand.
                </p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <Bot className="h-32 w-32 text-primary opacity-50" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-1">
                <div className="text-primary font-bold text-lg mb-2">Step 2</div>
                <h3 className="text-2xl font-bold mb-4">Train with Your Content</h3>
                <p className="text-gray-600 text-lg">
                  Upload documents, paste website content, or add FAQs. Your bot learns from your
                  data to provide accurate responses.
                </p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <Zap className="h-32 w-32 text-primary opacity-50" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="text-primary font-bold text-lg mb-2">Step 3</div>
                <h3 className="text-2xl font-bold mb-4">Embed on Your Site</h3>
                <p className="text-gray-600 text-lg">
                  Copy a single line of code and paste it into your website. Your AI chatbot is
                  now live and ready to help your customers.
                </p>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <Globe className="h-32 w-32 text-primary opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your customer support?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join businesses using ChatForge AI to automate support and delight customers.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Building for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6" />
                <span className="font-bold">ChatForge AI</span>
              </div>
              <p className="text-gray-400">
                Build powerful AI chatbots for your business.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ChatForge AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
