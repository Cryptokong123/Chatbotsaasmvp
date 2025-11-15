import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Zap, Globe, BarChart, Sparkles, MessageSquare, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Code Clouds */}
        <div className="absolute top-20 left-10 opacity-20 animate-float">
          <pre className="text-cyan-400 text-xs">
{`function chat() {
  return AI.respond()
}`}
          </pre>
        </div>
        <div className="absolute top-40 right-20 opacity-20 animate-float-delayed">
          <pre className="text-purple-400 text-xs">
{`const bot = {
  learn: true
}`}
          </pre>
        </div>
        <div className="absolute top-60 left-1/3 opacity-15 animate-float-slow">
          <pre className="text-blue-400 text-xs">
{`await train(data)
// Ready to help`}
          </pre>
        </div>
        <div className="absolute top-80 right-1/4 opacity-20 animate-float">
          <pre className="text-green-400 text-xs">
{`if (question) {
  answer()
}`}
          </pre>
        </div>

        {/* City Skyline */}
        <div className="absolute bottom-0 left-0 right-0 h-48">
          <svg
            className="w-full h-full opacity-30"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            {/* Buildings */}
            <rect x="0" y="200" width="80" height="120" fill="url(#cityGradient)" />
            <rect x="100" y="150" width="60" height="170" fill="url(#cityGradient)" />
            <rect x="180" y="180" width="70" height="140" fill="url(#cityGradient)" />
            <rect x="270" y="120" width="90" height="200" fill="url(#cityGradient)" />
            <rect x="380" y="160" width="75" height="160" fill="url(#cityGradient)" />
            <rect x="475" y="140" width="85" height="180" fill="url(#cityGradient)" />
            <rect x="580" y="170" width="65" height="150" fill="url(#cityGradient)" />
            <rect x="665" y="110" width="95" height="210" fill="url(#cityGradient)" />
            <rect x="780" y="150" width="70" height="170" fill="url(#cityGradient)" />
            <rect x="870" y="180" width="80" height="140" fill="url(#cityGradient)" />
            <rect x="970" y="130" width="75" height="190" fill="url(#cityGradient)" />
            <rect x="1065" y="160" width="85" height="160" fill="url(#cityGradient)" />
            <rect x="1170" y="140" width="70" height="180" fill="url(#cityGradient)" />
            <rect x="1260" y="190" width="60" height="130" fill="url(#cityGradient)" />
            <rect x="1340" y="160" width="100" height="160" fill="url(#cityGradient)" />

            {/* Windows on buildings */}
            <g opacity="0.8" fill="#60a5fa">
              <rect x="15" y="220" width="8" height="10" />
              <rect x="30" y="220" width="8" height="10" />
              <rect x="45" y="220" width="8" height="10" />
              <rect x="15" y="240" width="8" height="10" />
              <rect x="30" y="240" width="8" height="10" />
              <rect x="45" y="240" width="8" height="10" />
            </g>
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Bot className="h-8 w-8 text-blue-400" />
                <Sparkles className="h-4 w-4 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ChatForge AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Powered by GPT-4 & Advanced AI
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Build AI Chatbots
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              That Actually Work
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
            Transform your customer support with AI chatbots trained on your data.
            <span className="block text-blue-400 mt-2">No coding required. Deploy in minutes.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg shadow-blue-500/50">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Building Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-bold text-blue-400">5min</div>
              <div className="text-sm text-slate-400">Setup Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">24/7</div>
              <div className="text-sm text-slate-400">Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">GPT-4</div>
              <div className="text-sm text-slate-400">Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-slate-400">
              Built for businesses that value their customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: <Bot className="h-8 w-8" />,
                title: 'Train on Your Data',
                description: 'Upload documents, scrape URLs, or paste content. Your bot learns from your knowledge base.',
                color: 'blue'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Instant Responses',
                description: 'Powered by GPT-4, delivering accurate answers to your customers in milliseconds.',
                color: 'cyan'
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: 'One-Line Embed',
                description: 'Add to your website with a single script tag. Works on any platform.',
                color: 'purple'
              },
              {
                icon: <BarChart className="h-8 w-8" />,
                title: 'Analytics & Insights',
                description: 'Track performance, user satisfaction, and AI-powered suggestions to improve.',
                color: 'green'
              },
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: 'Smart Presets',
                description: 'Create preset responses for common questions to reduce API costs.',
                color: 'pink'
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Live Monitoring',
                description: 'Watch conversations in real-time and understand customer needs.',
                color: 'orange'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-${feature.color}-400`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Launch in 3 Simple Steps
              </span>
            </h2>
          </div>

          <div className="space-y-16">
            {[
              {
                step: '01',
                title: 'Create Your Bot',
                description: 'Sign up and customize your chatbot\'s name, colors, personality, and welcome message in seconds.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Train with Your Content',
                description: 'Upload PDFs, scrape your website, or paste FAQs. Your bot learns instantly and provides accurate answers.',
                gradient: 'from-cyan-500 to-purple-500'
              },
              {
                step: '03',
                title: 'Deploy Anywhere',
                description: 'Copy one line of code and add it to your website. Your AI assistant is live and ready to help customers.',
                gradient: 'from-purple-500 to-pink-500'
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className={`text-6xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent mb-4`}>
                    {item.step}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-white">{item.title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className={`flex-1 relative h-64 bg-gradient-to-br ${item.gradient} opacity-20 rounded-2xl`}>
                  <div className="absolute inset-0 bg-slate-900/80 rounded-2xl backdrop-blur-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-12 backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Ready to Transform Your Support?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join forward-thinking businesses using ChatForge AI to automate support and delight customers.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-2xl shadow-blue-500/50">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Building for Free
              </Button>
            </Link>
            <p className="text-sm text-slate-400 mt-4">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6 text-blue-400" />
                <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  ChatForge AI
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Build powerful AI chatbots for your business in minutes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-blue-400 transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 ChatForge AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
