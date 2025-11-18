import { NextRequest, NextResponse } from 'next/server'
import { processTrainingData } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'
import { parseDocument, chunkText } from '@/lib/document-parser'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const contentType = request.headers.get('content-type') || ''

    // Handle file uploads (multipart/form-data)
    if (contentType.includes('multipart/form-data') || contentType.includes('form-data')) {
      try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const botId = formData.get('botId') as string
        const autoChunk = formData.get('autoChunk') === 'true'

        if (!file) {
          return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
          )
        }

        if (!botId) {
          return NextResponse.json(
            { error: 'Bot ID is required' },
            { status: 400 }
          )
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'File size exceeds 10MB limit' },
            { status: 400 }
          )
        }

        // Parse document
        const parsedDoc = await parseDocument(file)

        // Chunk text if requested
        const textChunks = autoChunk
          ? chunkText(parsedDoc.text, 1000)
          : [parsedDoc.text]

        // Process each chunk through RAG system
        for (const [index, chunk] of textChunks.entries()) {
          await processTrainingData(
            botId,
            chunk,
            'document',
            `${file.name}${textChunks.length > 1 ? ` (chunk ${index + 1}/${textChunks.length})` : ''}`
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Document processed successfully',
          metadata: {
            fileName: file.name,
            fileType: parsedDoc.metadata.fileType,
            wordCount: parsedDoc.metadata.wordCount,
            pages: parsedDoc.metadata.pages,
            chunksCreated: textChunks.length,
          },
        })
      } catch (formError: any) {
        console.error('Form data parsing error:', formError)
        return NextResponse.json(
          { error: formError.message || 'Failed to process file upload' },
          { status: 400 }
        )
      }
    }

    // Handle JSON uploads (existing functionality)
    let requestBody
    try {
      requestBody = await request.json()
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected JSON or multipart/form-data' },
        { status: 400 }
      )
    }

    const { botId, content, sourceType, sourceName } = requestBody

    if (!botId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify bot exists and user has access (done via RLS)
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Process and store training data with embeddings
    await processTrainingData(
      botId,
      content,
      sourceType || 'text',
      sourceName
    )

    return NextResponse.json({
      success: true,
      message: 'Training data uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading training data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
