'use client'

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
                className={`relative ${
                  isPopular ? 'border-primary border-2 shadow-lg' : ''
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
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
                  <CardTitle className="text-2xl mb-2">{features.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {features.price === 0 && plan !== 'enterprise' ? 'Free' : plan === 'enterprise' ? 'Custom' : `$${features.price}`}
                    </span>
                    {features.price > 0 && plan !== 'enterprise' && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription>
                    {isDemo && 'Build and test for free'}
                    {plan === 'starter' && 'Perfect for small businesses'}
                    {plan === 'pro' && 'For growing companies'}
                    {plan === 'enterprise' && 'Custom solutions for enterprises'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {features.messagesPerMonth === -1
                          ? 'Unlimited messages'
                          : features.messagesPerMonth === 0
                            ? 'Preview only (no messages)'
                            : `${features.messagesPerMonth.toLocaleString()} messages/month`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {features.maxBots === -1
                          ? 'Unlimited bots'
                          : `Up to ${features.maxBots} bots`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {features.trainingDataMB === -1
                          ? 'Unlimited training data'
                          : `${features.trainingDataMB}MB training data`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {features.maxPresetResponses === -1
                          ? 'Unlimited preset responses'
                          : `${features.maxPresetResponses} preset responses`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.canUseActions ? (
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground">✗</span>
                      )}
                      <span className={`text-sm ${!features.canUseActions ? 'text-muted-foreground line-through' : ''}`}>
                        {features.canUseActions
                          ? features.maxActions === -1
                            ? 'Unlimited webhook actions'
                            : `${features.maxActions} webhook actions per bot`
                          : 'No webhook actions'}
                      </span>
                    </li>

                    {features.canUseActions && (
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {features.maxActionCalls === -1
                            ? 'Unlimited action calls'
                            : `${features.maxActionCalls} action calls/month`}
                        </span>
                      </li>
                    )}

                    <li className="flex items-start gap-2">
                      {features.canEmbed ? (
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground">✗</span>
                      )}
                      <span className={`text-sm ${!features.canEmbed ? 'text-muted-foreground line-through' : ''}`}>
                        Website embed
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.canUseAPI ? (
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground">✗</span>
                      )}
                      <span className={`text-sm ${!features.canUseAPI ? 'text-muted-foreground line-through' : ''}`}>
                        API access
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      {features.removesBranding ? (
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground">✗</span>
                      )}
                      <span className={`text-sm ${!features.removesBranding ? 'text-muted-foreground line-through' : ''}`}>
                        White-label (no branding)
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm capitalize">{features.analytics} analytics</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm capitalize">{features.support} support</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full"
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

        <div className="bg-muted rounded-lg p-8 text-center max-w-3xl mx-auto">
          <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Free to Build, Pay to Publish</h2>
          <p className="text-muted-foreground">
            Our <strong>Demo plan</strong> lets you build and test your chatbot completely free. Create your bot,
            add training data, set up preset responses, and see exactly how it works. When you're ready to deploy
            it to your website, simply upgrade to a paid plan to unlock embedding and API access.
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Questions about pricing? We're here to help!
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:sales@chatforge.ai">Contact Sales</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
