'use client'

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Zap, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { PLAN_FEATURES, type Plan } from '@/lib/plans'

export default function PricingPage() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (data) {
          setCurrentPlan((data.plan || 'demo') as Plan)
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const plans: Plan[] = ['demo', 'starter', 'pro', 'enterprise']

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white">
      {/* Navigation - Transparent Glass Effect */}
      <nav className="relative bg-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-white" />
              <span className="text-lg font-bold">ChatForge AI</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-white font-medium">
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

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Build for free, pay to publish. Choose the plan that's right for your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan) => {
            const features = PLAN_FEATURES[plan]
            const isCurrent = currentPlan === plan
            const isPopular = plan === 'starter'
            const isDemo = plan === 'demo'

            return (
              <Card
                key={plan}
                className={`relative bg-white/5 border-white/10 backdrop-blur-sm ${
                  isPopular ? 'border-white/30 border-2 shadow-lg' : ''
                } ${isCurrent ? 'ring-2 ring-white/50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-black text-sm font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2 text-white">{features.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">
                      {features.price === 0 && plan !== 'enterprise' ? 'Free' : plan === 'enterprise' ? 'Custom' : `$${features.price}`}
                    </span>
                    {features.price > 0 && plan !== 'enterprise' && (
                      <span className="text-gray-400">/month</span>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    {isDemo && 'Build and test for free'}
                    {plan === 'starter' && 'Perfect for small businesses'}
                    {plan === 'pro' && 'For growing companies'}
                    {plan === 'enterprise' && 'Custom solutions for enterprises'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        {features.messagesPerMonth === -1
                          ? 'Unlimited messages'
                          : features.messagesPerMonth === 0
                            ? 'Preview only (no messages)'
                            : `${features.messagesPerMonth.toLocaleString()} messages/month`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        {features.maxBots === -1
                          ? 'Unlimited bots'
                          : `Up to ${features.maxBots} bots`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        {features.trainingDataMB === -1
                          ? 'Unlimited training data'
                          : `${features.trainingDataMB}MB training data`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">
                        {features.maxPresetResponses === -1
                          ? 'Unlimited preset responses'
                          : `${features.maxPresetResponses} preset responses`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.canUseActions ? (
                        <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">✗</span>
                      )}
                      <span className={`text-sm ${!features.canUseActions ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        {features.canUseActions
                          ? features.maxActions === -1
                            ? 'Unlimited webhook actions'
                            : `${features.maxActions} webhook actions per bot`
                          : 'No webhook actions'}
                      </span>
                    </li>

                    {features.canUseActions && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">
                          {features.maxActionCalls === -1
                            ? 'Unlimited action calls'
                            : `${features.maxActionCalls} action calls/month`}
                        </span>
                      </li>
                    )}

                    <li className="flex items-start gap-2">
                      {features.canEmbed ? (
                        <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">✗</span>
                      )}
                      <span className={`text-sm ${!features.canEmbed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        Website embed
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.canUseAPI ? (
                        <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">✗</span>
                      )}
                      <span className={`text-sm ${!features.canUseAPI ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        API access
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.removesBranding ? (
                        <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">✗</span>
                      )}
                      <span className={`text-sm ${!features.removesBranding ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        White-label (no branding)
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300 capitalize">{features.analytics} analytics</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300 capitalize">{features.support} support</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full bg-white text-black hover:bg-gray-200"
                    variant={isPopular ? 'default' : 'outline'}
                    disabled={isCurrent || loading}
                    onClick={() => {
                      if (plan === 'enterprise') {
                        window.location.href = 'mailto:sales@chatforge.ai?subject=Enterprise Plan Inquiry'
                      } else if (plan === 'demo') {
                        router.push('/signup')
                      } else {
                        // TODO: Integrate Stripe
                        alert('Stripe integration coming soon! Contact sales@chatforge.ai to upgrade.')
                      }
                    }}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : plan === 'enterprise'
                        ? 'Contact Sales'
                        : plan === 'demo'
                          ? 'Get Started Free'
                          : 'Upgrade Now'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="bg-white/5 rounded-lg p-8 text-center max-w-3xl mx-auto backdrop-blur-sm border border-white/10">
          <Zap className="w-12 h-12 mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-bold mb-2 text-white">Free to Build, Pay to Publish</h2>
          <p className="text-gray-400">
            Our <strong className="text-white">Demo plan</strong> lets you build and test your chatbot completely free. Create your bot,
            add training data, set up preset responses, and see exactly how it works. When you're ready to deploy
            it to your website, simply upgrade to a paid plan to unlock embedding and API access.
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Questions about pricing? We're here to help!
          </p>
          <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
            <a href="mailto:sales@chatforge.ai">Contact Sales</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
