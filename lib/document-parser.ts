// Document parsing utilities for PDF and DOCX files
import * as pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export interface ParsedDocument {
  text: string
  metadata: {
    pages?: number
    wordCount: number
    fileName: string
    fileType: string
  }
}

export async function parsePDF(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    const data = await pdfParse(buffer)

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        fileName,
        fileType: 'pdf',
      },
    }
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message}`)
  }
}

export async function parseDOCX(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        fileName,
        fileType: 'docx',
      },
    }
  } catch (error: any) {
    throw new Error(`Failed to parse DOCX: ${error.message}`)
  }
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = file.name
  const fileType = file.name.split('.').pop()?.toLowerCase()

  switch (fileType) {
    case 'pdf':
      return parsePDF(buffer, fileName)
    case 'docx':
      return parseDOCX(buffer, fileName)
    case 'txt':
      return {
        text: buffer.toString('utf-8'),
        metadata: {
          wordCount: buffer.toString('utf-8').split(/\s+/).length,
          fileName,
          fileType: 'txt',
        },
      }
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

// Split text into chunks for better training
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
