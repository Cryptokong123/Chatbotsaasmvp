'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Upload, Trash2, FileText, Link2, File, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime, truncate } from '@/lib/utils'

interface Bot {
  id: string
  name: string
}

interface TrainingData {
  id: string
  content: string
  source_type: string
  source_name: string | null
  created_at: string
  bot_id: string
}

export default function TrainingDataPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [content, setContent] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [dataToDelete, setDataToDelete] = useState<{ id: string; name: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [autoChunk, setAutoChunk] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchBots()
  }, [])

  useEffect(() => {
    if (selectedBot) {
      fetchTrainingData()
    }
  }, [selectedBot])

  const fetchBots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bots')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBots(data || [])
      if (data && data.length > 0) {
        setSelectedBot(data[0].id)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bots',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainingData = async () => {
    if (!selectedBot) return

    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('bot_id', selectedBot)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrainingData(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch training data',
        variant: 'destructive',
      })
    }
  }

  const handleUpload = async () => {
    if (!content.trim() || !selectedBot) {
      toast({
        title: 'Error',
        description: 'Please select a bot and enter content',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const response = await fetch('/api/training/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBot,
          content,
          sourceType: 'text',
          sourceName: sourceName || 'Manual Upload',
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Upload failed')

      toast({
        title: 'Success',
        description: 'Training data uploaded successfully',
      })

      setContent('')
      setSourceName('')
      fetchTrainingData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload training data',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleScrapeUrl = async () => {
    if (!url.trim() || !selectedBot) {
      toast({
        title: 'Error',
        description: 'Please select a bot and enter a URL',
        variant: 'destructive',
      })
      return
    }

    setScraping(true)

    try {
      const response = await fetch('/api/training/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBot,
          url,
        }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Scraping failed')

      toast({
        title: 'Success',
        description: `Scraped ${result.stats.wordCount} words from "${result.stats.title}"`,
      })

      setUrl('')
      fetchTrainingData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to scrape URL',
        variant: 'destructive',
      })
    } finally {
      setScraping(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDataToDelete({ id, name })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!dataToDelete) return

    try {
      const { error } = await supabase
        .from('training_data')
        .delete()
        .eq('id', dataToDelete.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Training data deleted',
      })

      fetchTrainingData()
      setDeleteConfirmOpen(false)
      setDataToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete training data',
        variant: 'destructive',
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOCX, or TXT file',
        variant: 'destructive',
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    setUploadResult(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedBot) {
      toast({
        title: 'Error',
        description: 'Please select a bot and a file',
        variant: 'destructive',
      })
      return
    }

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('botId', selectedBot)
      formData.append('autoChunk', autoChunk.toString())

      const response = await fetch('/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Upload failed')

      setUploadResult(result.metadata)

      toast({
        title: 'Success',
        description: `Document processed successfully! Created ${result.metadata.chunksCreated} chunk${result.metadata.chunksCreated !== 1 ? 's' : ''}.`,
      })

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchTrainingData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (bots.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bots found</h3>
          <p className="text-gray-600 mb-6">Create a bot first to add training data</p>
          <Button onClick={() => (window.location.href = '/dashboard/bots/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Training Data</h1>
        <p className="text-gray-600 mt-1">Upload content to train your chatbots</p>
      </div>

      <div className="space-y-6">
        {/* Bot Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Bot</CardTitle>
            <CardDescription>Choose which bot to add training data to</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              id="bot"
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5 text-purple-500" />
              Upload Document
            </CardTitle>
            <CardDescription>Upload PDF, DOCX, or TXT files to train your bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setUploadResult(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="font-medium text-gray-700">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOCX, and TXT files up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Auto-chunk Option */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="auto-chunk" className="text-base font-medium cursor-pointer">
                  Auto-chunk document
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically split large documents into optimal chunks for better training
                </p>
              </div>
              <Switch
                id="auto-chunk"
                checked={autoChunk}
                onCheckedChange={setAutoChunk}
              />
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Upload Successful!</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-700">File:</span>{' '}
                        <span className="text-green-900 font-medium">{uploadResult.fileName}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Type:</span>{' '}
                        <span className="text-green-900 font-medium">{uploadResult.fileType.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Words:</span>{' '}
                        <span className="text-green-900 font-medium">{uploadResult.wordCount.toLocaleString()}</span>
                      </div>
                      {uploadResult.pages && (
                        <div>
                          <span className="text-green-700">Pages:</span>{' '}
                          <span className="text-green-900 font-medium">{uploadResult.pages}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-green-700">Chunks:</span>{' '}
                        <span className="text-green-900 font-medium">{uploadResult.chunksCreated}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleFileUpload}
              disabled={uploadingFile || !selectedFile}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingFile ? 'Processing...' : 'Upload Document'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* URL Scraper Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-500" />
                Import from URL
              </CardTitle>
              <CardDescription>Automatically extract content from any webpage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/documentation"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={scraping}
                />
                <p className="text-sm text-gray-500">
                  Enter a URL to automatically extract and import its content
                </p>
              </div>

              <Button onClick={handleScrapeUrl} disabled={scraping || !url.trim()} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                {scraping ? 'Scraping...' : 'Import from URL'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Use this to quickly import your knowledge base, documentation, FAQs, or any public webpage content.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-500" />
                Manual Upload
              </CardTitle>
              <CardDescription>Paste text content directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceName">Source Name (Optional)</Label>
                <Input
                  id="sourceName"
                  placeholder="e.g., Product Documentation"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={uploading}
                  rows={6}
                />
              </div>

              <Button onClick={handleUpload} disabled={uploading || !content.trim()} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Training Data'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Training Data List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Training Data</CardTitle>
            <CardDescription>
              {trainingData.length} item{trainingData.length !== 1 ? 's' : ''} for selected bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trainingData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No training data yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {trainingData.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {item.source_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(item.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id, item.source_name || 'Untitled')}
                        aria-label={`Delete ${item.source_name || 'training data'}`}
                        title="Delete training data"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">
                      {truncate(item.content, 150)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete training data &quot;{dataToDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this training data. Your bot will no longer have access to this information.
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
