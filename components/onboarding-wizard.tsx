'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, Rocket, Bot, FileText, TestTube, Code, Sparkles } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function OnboardingWizard({ open, onOpenChange, userId }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [botId, setBotId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Form data
  const [botName, setBotName] = useState('')
  const [botDescription, setBotDescription] = useState('')
  const [botInstructions, setBotInstructions] = useState('You are a helpful assistant. Answer questions based on the provided context.')

  const totalSteps = 5

  const handleCreateBot = async () => {
    if (!botName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a bot name',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bots')
        .insert({
          user_id: userId,
          name: botName,
          description: botDescription,
          instructions: botInstructions,
        })
        .select()
        .single()

      if (error) throw error

      setBotId(data.id)

      // Update user onboarding step
      await supabase
        .from('users')
        .update({ onboarding_step: 1 })
        .eq('id', userId)

      setStep(2)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkipToKnowledge = () => {
    if (botId) {
      router.push(`/dashboard/bots/${botId}/knowledge`)
      handleComplete()
    }
  }

  const handleSkipToTest = () => {
    if (botId) {
      router.push(`/dashboard/bots/${botId}/test`)
      handleComplete()
    }
  }

  const handleSkipToEmbed = () => {
    if (botId) {
      router.push(`/dashboard/bots/${botId}/embed`)
      handleComplete()
    }
  }

  const handleComplete = async () => {
    try {
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_step: totalSteps
        })
        .eq('id', userId)

      onOpenChange(false)

      if (botId) {
        router.push(`/dashboard/bots/${botId}`)
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Welcome to ChatForge AI!
          </DialogTitle>
          <DialogDescription>
            Let's get you set up in just a few steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    s <= step
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-0.5 w-12 transition-colors ${
                      s < step ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Create Bot */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Bot className="h-5 w-5 text-primary" />
                Create Your First Bot
              </div>
              <p className="text-sm text-muted-foreground">
                Give your chatbot a name and describe what it will help with
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="botName">Bot Name *</Label>
                  <Input
                    id="botName"
                    placeholder="e.g., Customer Support Bot"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botDescription">Description (optional)</Label>
                  <Textarea
                    id="botDescription"
                    placeholder="Describe what your bot does..."
                    value={botDescription}
                    onChange={(e) => setBotDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botInstructions">System Instructions</Label>
                  <Textarea
                    id="botInstructions"
                    value={botInstructions}
                    onChange={(e) => setBotInstructions(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These instructions guide how your bot responds
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Skip Setup
                </Button>
                <Button onClick={handleCreateBot} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Bot'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Add Knowledge */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-primary" />
                Add Knowledge Base
              </div>
              <p className="text-sm text-muted-foreground">
                Upload documents or add URLs to teach your bot
              </p>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium mb-2">Ready to add knowledge!</p>
                <p className="text-xs text-muted-foreground mb-4">
                  You can upload PDFs, text files, or add website URLs
                </p>
                <Button onClick={handleSkipToKnowledge}>
                  Go to Knowledge Base
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Skip for Now
                  </Button>
                  <Button onClick={handleSkipToKnowledge}>
                    Add Knowledge
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Test Bot */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <TestTube className="h-5 w-5 text-primary" />
                Test Your Bot
              </div>
              <p className="text-sm text-muted-foreground">
                Try chatting with your bot to see how it responds
              </p>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <TestTube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium mb-2">Test your bot!</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Open the testing interface to chat with your bot
                </p>
                <Button onClick={handleSkipToTest}>
                  Open Test Chat
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    Skip for Now
                  </Button>
                  <Button onClick={handleSkipToTest}>
                    Test Bot
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Embed Code */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Code className="h-5 w-5 text-primary" />
                Get Embed Code
              </div>
              <p className="text-sm text-muted-foreground">
                Add your chatbot to your website with a simple code snippet
              </p>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Code className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium mb-2">Ready to embed!</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Copy the code and paste it into your website
                </p>
                <Button onClick={handleSkipToEmbed}>
                  Get Embed Code
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Embedding requires a paid plan. Upgrade to publish your bot!
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(5)}>
                    Skip for Now
                  </Button>
                  <Button onClick={handleSkipToEmbed}>
                    Get Code
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-primary" />
                You're All Set!
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
                <Sparkles className="mx-auto h-16 w-16 text-primary mb-4" />
                <p className="text-lg font-semibold mb-2">Welcome aboard! 🎉</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your bot is ready. Here are some things you can do next:
                </p>

                <div className="grid gap-3 text-left max-w-md mx-auto">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Add preset responses</p>
                      <p className="text-xs text-muted-foreground">Save costs with instant answers</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Set up webhook actions</p>
                      <p className="text-xs text-muted-foreground">Let your bot take actions</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Customize appearance</p>
                      <p className="text-xs text-muted-foreground">Match your brand colors</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button onClick={handleComplete}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
