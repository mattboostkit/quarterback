'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface FileUploadProps {
  projectId: string
  onUploadComplete: (personaId: string) => void
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'text/csv') {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase is not configured. Please check your environment variables.')
      }

      // Upload file to Supabase Storage
      const fileName = `${projectId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('csv-uploads')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        if (uploadError.message?.includes('JWT') || uploadError.message?.includes('401')) {
          throw new Error('Authentication error. Please check your Supabase configuration.')
        }
        throw uploadError
      }

      // Parse CSV content
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ''
            return obj
          }, {} as Record<string, string>)
        })

      // Create persona with initial data
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          project_id: projectId,
          name: `Persona from ${file.name}`,
          csv_file_path: uploadData.path,
          raw_data: data,
          summary: 'Processing persona data...'
        })
        .select()
        .single()

      if (personaError) throw personaError

      // Trigger processing (in a real app, this would call an edge function)
      // For now, we'll just simulate processing
      setTimeout(() => {
        onUploadComplete(persona.id)
      }, 1000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV Data</CardTitle>
        <CardDescription>
          Upload a CSV file containing audience data to create a new persona
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload and Create Persona'}
        </Button>
      </CardContent>
    </Card>
  )
}