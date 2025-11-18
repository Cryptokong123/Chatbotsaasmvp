'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Check } from 'lucide-react'

export default function LandingPage() {
  const [typedText, setTypedText] = useState('')
  const [showDeployInstantly, setShowDeployInstantly] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const fullText = 'Build AI chatbots and agents.'

  useEffect(() => {
    // Add smooth scrolling to the document
    document.documentElement.style.scrollBehavior = 'smooth'

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        setTimeout(() => setShowDeployInstantly(true), 300)
      }
    }, 60)

    return () => {
      clearInterval(typingInterval)
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  // All 20+ platforms for scrollers
  const allPlatforms = [
    'WhatsApp', 'Telegram', 'Slack', 'Discord', 'Teams',
    'Messenger', 'Instagram', 'Twitter', 'LinkedIn', 'SMS',
    'Voice', 'Email', 'WeChat', 'Line', 'Viber',
    'Kakao', 'Alexa', 'Google Assistant', 'Google Business', 'Apple Business'
  ]

  const firstSetPlatforms = allPlatforms.slice(0, 10)
  const secondSetPlatforms = allPlatforms.slice(10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white overflow-hidden">
      {/* Dot Matrix Clouds - Keep these */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        {/* Cloud 1 */}
        <div className="absolute top-20 left-10">
          <svg width="200" height="80" viewBox="0 0 200 80">
            <defs>
              <pattern id="dots1" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#666" />
              </pattern>
            </defs>
            <ellipse cx="100" cy="40" rx="90" ry="35" fill="url(#dots1)" />
          </svg>
        </div>

        {/* Cloud 2 */}
        <div className="absolute top-32 right-20">
          <svg width="180" height="70" viewBox="0 0 180 70">
            <defs>
              <pattern id="dots2" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#666" />
              </pattern>
            </defs>
            <ellipse cx="90" cy="35" rx="80" ry="30" fill="url(#dots2)" />
          </svg>
        </div>

        {/* Cloud 3 */}
        <div className="absolute top-48 left-1/3">
          <svg width="220" height="90" viewBox="0 0 220 90">
            <defs>
              <pattern id="dots3" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#666" />
              </pattern>
            </defs>
            <ellipse cx="110" cy="45" rx="100" ry="40" fill="url(#dots3)" />
          </svg>
        </div>

        {/* Cloud 4 */}
        <div className="absolute top-60 right-1/4">
          <svg width="160" height="65" viewBox="0 0 160 65">
            <defs>
              <pattern id="dots4" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#666" />
              </pattern>
            </defs>
            <ellipse cx="80" cy="32" rx="70" ry="28" fill="url(#dots4)" />
          </svg>
        </div>
      </div>

      {/* Faded City Skyline */}
      <div className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1440 256" preserveAspectRatio="none">
          <defs>
            <pattern id="cityDots" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.6" fill="#444" />
            </pattern>
            <pattern id="windowDots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1.2" fill="#888" />
            </pattern>
          </defs>

          {/* Buildings */}
          <rect x="0" y="150" width="80" height="106" fill="url(#cityDots)" />
          <rect x="10" y="160" width="15" height="30" fill="url(#windowDots)" />
          <rect x="30" y="160" width="15" height="30" fill="url(#windowDots)" />
          <rect x="55" y="160" width="15" height="30" fill="url(#windowDots)" />

          <rect x="100" y="120" width="70" height="136" fill="url(#cityDots)" />
          <rect x="110" y="135" width="12" height="25" fill="url(#windowDots)" />
          <rect x="130" y="135" width="12" height="25" fill="url(#windowDots)" />
          <rect x="150" y="135" width="12" height="25" fill="url(#windowDots)" />

          <rect x="190" y="140" width="75" height="116" fill="url(#cityDots)" />
          <rect x="200" y="155" width="14" height="28" fill="url(#windowDots)" />
          <rect x="220" y="155" width="14" height="28" fill="url(#windowDots)" />
          <rect x="240" y="155" width="14" height="28" fill="url(#windowDots)" />

          <rect x="285" y="100" width="90" height="156" fill="url(#cityDots)" />
          <rect x="295" y="115" width="15" height="30" fill="url(#windowDots)" />
          <rect x="318" y="115" width="15" height="30" fill="url(#windowDots)" />
          <rect x="342" y="115" width="15" height="30" fill="url(#windowDots)" />

          <rect x="395" y="130" width="80" height="126" fill="url(#cityDots)" />
          <rect x="405" y="145" width="14" height="28" fill="url(#windowDots)" />
          <rect x="425" y="145" width="14" height="28" fill="url(#windowDots)" />
          <rect x="450" y="145" width="14" height="28" fill="url(#windowDots)" />

          <rect x="495" y="110" width="85" height="146" fill="url(#cityDots)" />
          <rect x="505" y="125" width="15" height="30" fill="url(#windowDots)" />
          <rect x="528" y="125" width="15" height="30" fill="url(#windowDots)" />
          <rect x="552" y="125" width="15" height="30" fill="url(#windowDots)" />

          <rect x="600" y="135" width="75" height="121" fill="url(#cityDots)" />
          <rect x="610" y="150" width="13" height="26" fill="url(#windowDots)" />
          <rect x="630" y="150" width="13" height="26" fill="url(#windowDots)" />
          <rect x="652" y="150" width="13" height="26" fill="url(#windowDots)" />

          <rect x="695" y="90" width="95" height="166" fill="url(#cityDots)" />
          <rect x="705" y="105" width="16" height="32" fill="url(#windowDots)" />
          <rect x="730" y="105" width="16" height="32" fill="url(#windowDots)" />
          <rect x="758" y="105" width="16" height="32" fill="url(#windowDots)" />

          <rect x="810" y="125" width="78" height="131" fill="url(#cityDots)" />
          <rect x="820" y="140" width="14" height="28" fill="url(#windowDots)" />
          <rect x="842" y="140" width="14" height="28" fill="url(#windowDots)" />
          <rect x="864" y="140" width="14" height="28" fill="url(#windowDots)" />

          <rect x="908" y="145" width="82" height="111" fill="url(#cityDots)" />
          <rect x="918" y="160" width="14" height="28" fill="url(#windowDots)" />
          <rect x="940" y="160" width="14" height="28" fill="url(#windowDots)" />
          <rect x="965" y="160" width="14" height="28" fill="url(#windowDots)" />

          <rect x="1010" y="115" width="80" height="141" fill="url(#cityDots)" />
          <rect x="1020" y="130" width="15" height="30" fill="url(#windowDots)" />
          <rect x="1043" y="130" width="15" height="30" fill="url(#windowDots)" />
          <rect x="1068" y="130" width="15" height="30" fill="url(#windowDots)" />

          <rect x="1110" y="135" width="85" height="121" fill="url(#cityDots)" />
          <rect x="1120" y="150" width="15" height="30" fill="url(#windowDots)" />
          <rect x="1145" y="150" width="15" height="30" fill="url(#windowDots)" />
          <rect x="1172" y="150" width="15" height="30" fill="url(#windowDots)" />

          <rect x="1215" y="105" width="78" height="151" fill="url(#cityDots)" />
          <rect x="1225" y="120" width="14" height="28" fill="url(#windowDots)" />
          <rect x="1247" y="120" width="14" height="28" fill="url(#windowDots)" />
          <rect x="1271" y="120" width="14" height="28" fill="url(#windowDots)" />

          <rect x="1313" y="155" width="70" height="101" fill="url(#cityDots)" />
          <rect x="1323" y="170" width="12" height="24" fill="url(#windowDots)" />
          <rect x="1343" y="170" width="12" height="24" fill="url(#windowDots)" />
          <rect x="1363" y="170" width="12" height="24" fill="url(#windowDots)" />

          <rect x="1403" y="130" width="37" height="126" fill="url(#cityDots)" />
        </svg>
      </div>

      {/* Navigation - Glass Effect */}
      <nav className="relative bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-white" />
              <span className="text-lg font-bold">ChatForge AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-gray-300 hover:text-white transition-colors">
                Docs
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Typing Animation */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
            {typedText}
            {showCursor && <span className="inline-block w-1 h-16 bg-white ml-1 animate-pulse"></span>}
            <br />
            <span
              className={`transition-all duration-500 ${
                showDeployInstantly ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Deploy instantly.
            </span>
          </h1>

          <p
            className={`text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto transition-all duration-700 delay-300 ${
              showDeployInstantly ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Every customer deserves instant support. Train your bot on your data,
            <br className="hidden sm:block" />
            embed with one line of code, and scale effortlessly.
          </p>

          <div className={`transition-all duration-700 delay-500 ${
            showDeployInstantly ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <Link href="/register">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-10 py-6 rounded-full font-medium">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Feature Pills - No emojis */}
          <div className={`flex flex-wrap justify-center gap-3 mt-16 transition-all duration-700 delay-700 ${
            showDeployInstantly ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm backdrop-blur-sm">
              <Check className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">No code required</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm backdrop-blur-sm">
              <Check className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">GPT-4 powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm backdrop-blur-sm">
              <Check className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">Train on your data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm backdrop-blur-sm">
              <Check className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">5-minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Logos Infinite Scroll - No Emojis, Fading Streaks */}
      <section className="relative py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-wider">Supports 20+ Platforms</p>

          {/* First Scroller - Left to Right */}
          <div className="relative flex overflow-hidden mb-6">
            <div className="flex animate-scroll-infinite whitespace-nowrap">
              {[...firstSetPlatforms, ...firstSetPlatforms].map((platform, index) => (
                <div
                  key={`first-${index}`}
                  className="relative inline-flex items-center mx-6 px-8 py-3 overflow-hidden"
                >
                  {/* Fading streak background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30 rounded-lg"></div>
                  <span className="relative text-lg font-medium text-gray-300">{platform}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Second Scroller - Right to Left */}
          <div className="relative flex overflow-hidden">
            <div className="flex animate-scroll-infinite-reverse whitespace-nowrap">
              {[...secondSetPlatforms, ...secondSetPlatforms].map((platform, index) => (
                <div
                  key={`second-${index}`}
                  className="relative inline-flex items-center mx-6 px-8 py-3 overflow-hidden"
                >
                  {/* Fading streak background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30 rounded-lg"></div>
                  <span className="relative text-lg font-medium text-gray-300">{platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - No emojis */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">Everything you need</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade features for businesses of all sizes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant Responses</h3>
              <p className="text-gray-400 leading-relaxed">
                Powered by GPT-4. Your customers get accurate answers in milliseconds, 24/7.
              </p>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Training</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload docs, scrape URLs, or paste FAQs. Your bot learns from your knowledge base.
              </p>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Live Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Monitor conversations in real-time. Get AI-powered insights to improve performance.
              </p>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">One-Line Embed</h3>
              <p className="text-gray-400 leading-relaxed">
                Add to any website with a single script tag. Works everywhere, instantly.
              </p>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cost Optimization</h3>
              <p className="text-gray-400 leading-relaxed">
                Smart presets reduce API costs by up to 70%. Pay only for what you use.
              </p>
            </div>

            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Full Customization</h3>
              <p className="text-gray-400 leading-relaxed">
                Match your brand perfectly. Customize colors, messages, and personality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-bold mb-8">
            Ready to transform
            <br />
            your customer support?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join forward-thinking businesses automating support with AI.
            <br />
            Start free. No credit card required.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-10 py-6 rounded-full font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5" />
                <span className="font-bold">ChatForge AI</span>
              </div>
              <p className="text-sm text-gray-400">
                AI chatbots for modern businesses
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 ChatForge AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-infinite-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }

        .animate-scroll-infinite-reverse {
          animation: scroll-infinite-reverse 30s linear infinite;
        }

        .animate-scroll-infinite:hover,
        .animate-scroll-infinite-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
