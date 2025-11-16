'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles, Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { agentPlans, bundlePlans } from '@/lib/agent-plans'

export default function AgentPricingPage() {
  const [showBundles, setShowBundles] = useState(false)

  const platformIcons: Record<string, string> = {
    whatsapp: '💬',
    telegram: '✈️',
    slack: '💼',
    discord: '🎮',
    messenger: '📱',
    sms: '📧',
    email: '✉️',
    voice: '📞',
  }

  const getPlanIcon = (planId: string) => {
    if (planId.includes('demo')) return Zap
    if (planId.includes('enterprise')) return Crown
    if (planId.includes('pro')) return Sparkles
    return Check
  }

  const displayPlans = showBundles ? bundlePlans : agentPlans

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">AI Agent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy intelligent agents across 20+ messaging platforms. Start free, scale as you grow.
          </p>

          {/* Toggle between standalone and bundles */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <Label htmlFor="bundle-toggle" className={!showBundles ? 'font-semibold' : ''}>
              Agent Plans
            </Label>
            <Switch
              id="bundle-toggle"
              checked={showBundles}
              onCheckedChange={setShowBundles}
            />
            <Label htmlFor="bundle-toggle" className={showBundles ? 'font-semibold' : ''}>
              Bundles (Save 12-20%)
              <Badge variant="secondary" className="ml-2">Recommended</Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {displayPlans.map((plan) => {
            const Icon = getPlanIcon(plan.id)
            const isPopular = plan.id.includes('pro')
            const isFree = plan.price === 0

            return (
              <Card
                key={plan.id}
                className={`relative ${isPopular ? 'border-primary shadow-xl scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    {isFree ? (
                      <div className="text-4xl font-bold">Free</div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                    {plan.savings && (
                      <Badge variant="secondary" className="mt-2">
                        Save ${plan.savings}/mo
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>{plan.limits.agents === 999999 ? 'Unlimited' : plan.limits.agents}</strong> agent{plan.limits.agents !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <strong>{plan.limits.messages.toLocaleString()}</strong> messages/month
                      </span>
                    </div>

                    {/* Platforms */}
                    {plan.features.platforms === 'all' ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">ALL platforms</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Platforms:</div>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.platforms.slice(0, 6).map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platformIcons[platform] || '📱'} {platform}
                            </Badge>
                          ))}
                          {plan.features.platforms.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{plan.features.platforms.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {plan.features.sentiment_analysis && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Sentiment Analysis</span>
                      </div>
                    )}
                    {plan.features.multi_language && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Multi-language</span>
                      </div>
                    )}
                    {plan.features.handoff_to_human && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Human handoff</span>
                      </div>
                    )}
                    {plan.features.voice && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Voice support</span>
                      </div>
                    )}
                    {plan.features.white_label && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">White-label</span>
                      </div>
                    )}
                    {plan.features.advanced_analytics && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Advanced analytics</span>
                      </div>
                    )}
                    {plan.features.priority_support && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    )}
                    {plan.features.sso && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">SSO & SAML</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {isFree ? 'Start Free' : plan.id.includes('enterprise') ? 'Contact Sales' : 'Get Started'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-6xl mx-auto pt-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Why Choose Bundles?</CardTitle>
              <CardDescription>Combine chatbots and agents for maximum value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Save 12-20%</h3>
                  <p className="text-sm text-muted-foreground">
                    Bundle pricing gives you both chatbots and agents at a discounted rate
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Unified Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage both chatbots and agents from a single dashboard
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Seamless Handoff</h3>
                  <p className="text-sm text-muted-foreground">
                    Transfer conversations from chatbots to agents with shared context
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto pt-12">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's the difference between chatbots and agents?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chatbots are embedded on your website, while agents work across 20+ messaging platforms like WhatsApp, Telegram, Slack, and Discord. Agents bring your AI to where your customers already are.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade or downgrade anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes are prorated, so you only pay for what you use.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my message limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional messages at $0.02-$0.05 per message depending on your plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer custom enterprise plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Enterprise plans include unlimited agents, dedicated support, SSO, SLA guarantees, and custom features. Contact our sales team to discuss your needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-12">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to get started?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Start with a free demo account. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button size="lg" variant="secondary">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
