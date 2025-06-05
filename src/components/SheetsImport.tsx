'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react'

interface AvailablePersona {
  name: string
  percentage: string
  summary: string
  dataPoints: {
    topics: number
    socialMedia: number
    media: number
    influencers: number
    brands: number
    total: number
  }
}

interface SheetsImportProps {
  projectId: string
  onImportComplete: (personaId: string) => void
}

export function SheetsImport({ projectId, onImportComplete }: SheetsImportProps) {
  const [availablePersonas, setAvailablePersonas] = useState<AvailablePersona[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sheetsConfigured, setSheetsConfigured] = useState(false)

  useEffect(() => {
    loadAvailablePersonas()
  }, [])

  const loadAvailablePersonas = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/sheets-import')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load personas')
      }

      setAvailablePersonas(data.available_personas || [])
      setSheetsConfigured(data.sheetsConfigured)

    } catch (err) {
      console.error('Error loading personas:', err)
      setError(err instanceof Error ? err.message : 'Failed to load personas')
    } finally {
      setLoading(false)
    }
  }

  const importPersona = async (personaName: string) => {
    setImporting(personaName)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/sheets-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName,
          projectId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      console.log('Import successful:', data)
      onImportComplete(data.persona.id)

    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(null)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/sheets-import?test=true')
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Google Sheets Connection Successful!\n\nSheet: ${data.data?.title}\nSheets: ${data.data?.sheets?.join(', ')}`)
      } else {
        alert(`❌ Connection Failed: ${data.message}`)
      }
    } catch (err) {
      alert(`❌ Test Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sheet className="w-5 h-5" />
          Google Sheets Import
        </CardTitle>
        <CardDescription>
          Import audience personas directly from your Google Sheets database
        </CardDescription>
        
        <div className="flex items-center gap-2 pt-2">
          <Badge variant={sheetsConfigured ? "default" : "destructive"}>
            {sheetsConfigured ? "✅ Configured" : "❌ API Key Required"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testConnection}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAvailablePersonas}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!sheetsConfigured && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
            <p className="text-sm text-yellow-700 mb-3">
              To import from Google Sheets, you need to add your Google Sheets API key to the environment variables.
            </p>
            <div className="text-xs text-yellow-600 font-mono bg-yellow-100 p-2 rounded">
              GOOGLE_SHEETS_API_KEY=your_api_key_here
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading available personas...</p>
          </div>
        ) : availablePersonas.length === 0 ? (
          <div className="text-center py-8">
            <Sheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No personas found</p>
            <p className="text-sm text-gray-500">
              {sheetsConfigured ? 'Check your Google Sheets data' : 'Configure Google Sheets API first'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Available Personas</h4>
            {availablePersonas.map((persona) => (
              <div 
                key={persona.name}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium">{persona.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{persona.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline">{persona.percentage}</Badge>
                    <Button
                      size="sm"
                      onClick={() => importPersona(persona.name)}
                      disabled={importing !== null}
                      className="h-7"
                    >
                      {importing === persona.name ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{persona.dataPoints.total} data points</span>
                  <span>•</span>
                  <span>{persona.dataPoints.topics} topics</span>
                  <span>•</span>
                  <span>{persona.dataPoints.socialMedia} social</span>
                  <span>•</span>
                  <span>{persona.dataPoints.influencers} influencers</span>
                  <span>•</span>
                  <span>{persona.dataPoints.brands} brands</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}