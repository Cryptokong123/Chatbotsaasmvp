'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Check, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Integration {
  type: string
  displayName: string
  description: string
  category: string
  logoUrl?: string
  isVerified: boolean
  isPopular: boolean
  capabilities: {
    canSendMessages: boolean
    canReceiveMessages: boolean
    supportsWebhooks: boolean
    supportsOAuth: boolean
    canSyncContacts: boolean
    canSyncConversations: boolean
  }
  pricing?: {
    tier: 'free' | 'premium' | 'enterprise'
  }
}

export default function IntegrationMarketplace() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTab, setSelectedTab] = useState('all')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'crm', label: 'CRM' },
    { value: 'messaging', label: 'Messaging' },
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Social Media' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'payment', label: 'Payments' },
    { value: 'productivity', label: 'Productivity' },
  ]

  useEffect(() => {
    fetchIntegrations()
  }, [])

  useEffect(() => {
    filterIntegrations()
  }, [searchQuery, selectedCategory, selectedTab, integrations])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      const data = await response.json()
      if (data.success) {
        setIntegrations(data.data.integrations)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterIntegrations = () => {
    let filtered = integrations

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (integration) =>
          integration.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((integration) => integration.category === selectedCategory)
    }

    // Filter by tab
    if (selectedTab === 'popular') {
      filtered = filtered.filter((integration) => integration.isPopular)
    } else if (selectedTab === 'verified') {
      filtered = filtered.filter((integration) => integration.isVerified)
    }

    setFilteredIntegrations(filtered)
  }

  const handleConnect = async (integrationType: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationType}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      }
    } catch (error) {
      console.error('Failed to connect integration:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Integration Marketplace</h1>
        <p className="text-gray-600">
          Connect your favorite tools and platforms to supercharge your chatbot
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="popular">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="verified">
            <Check className="h-4 w-4 mr-2" />
            Verified
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {/* Integrations Grid */}
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No integrations found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.type} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {integration.logoUrl ? (
                          <img
                            src={integration.logoUrl}
                            alt={integration.displayName}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {integration.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{integration.displayName}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {integration.category}
                          </Badge>
                        </div>
                      </div>
                      {integration.isVerified && (
                        <Badge variant="default" className="bg-blue-600">
                          <Check className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="min-h-[60px]">
                      {integration.description}
                    </CardDescription>

                    {/* Capabilities */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {integration.capabilities.canSendMessages && (
                        <Badge variant="outline" className="text-xs">
                          Send Messages
                        </Badge>
                      )}
                      {integration.capabilities.canReceiveMessages && (
                        <Badge variant="outline" className="text-xs">
                          Receive Messages
                        </Badge>
                      )}
                      {integration.capabilities.supportsWebhooks && (
                        <Badge variant="outline" className="text-xs">
                          Webhooks
                        </Badge>
                      )}
                      {integration.capabilities.canSyncContacts && (
                        <Badge variant="outline" className="text-xs">
                          Contact Sync
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(integration.type)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Integrations</CardDescription>
            <CardTitle className="text-3xl">{integrations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Popular</CardDescription>
            <CardTitle className="text-3xl">
              {integrations.filter((i) => i.isPopular).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl">
              {integrations.filter((i) => i.isVerified).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(integrations.map((i) => i.category)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
