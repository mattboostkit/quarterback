'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/FileUpload'
import { SheetsImport } from '@/components/SheetsImport'
import { PersonaChat } from '@/components/PersonaChat'
import { DebugPanel } from '@/components/DebugPanel'
import { SimpleTest } from '@/components/SimpleTest'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, MessageSquare, Trash2 } from 'lucide-react'

type Persona = {
  id: string
  name: string
  raw_data: any
  enriched_data?: any
  summary?: string
  created_at: string
}

const DEMO_PROJECT_ID = '22222222-2222-2222-2222-222222222222'

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [activeView, setActiveView] = useState<'upload' | 'sheets' | 'chat'>('upload')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('project_id', DEMO_PROJECT_ID)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPersonas(data || [])
    } catch (error) {
      console.error('Error loading personas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = async (personaId: string) => {
    // Note: Enrichment would be handled by N8N webhook in production
    console.log('Persona enrichment triggered for:', personaId)
    
    // Reload personas
    await loadPersonas()
    
    // Select the new persona
    const newPersona = personas.find(p => p.id === personaId)
    if (newPersona) {
      setSelectedPersona(newPersona)
      setActiveView('chat')
    }
  }

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona? This will also delete all associated conversations.')) {
      return
    }

    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete persona')
      }

      // If the deleted persona was selected, clear selection
      if (selectedPersona?.id === personaId) {
        setSelectedPersona(null)
        setActiveView('upload')
      }

      // Reload personas
      await loadPersonas()
      
    } catch (error: any) {
      console.error('Error deleting persona:', error)
      alert(`Failed to delete persona: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Quarterback</h1>
          <p className="text-gray-600 mt-2">AI-Powered Audience Persona Insights</p>
          
          {/* Debug Test Buttons */}
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <h3 className="font-bold text-yellow-800 mb-2">🧪 Debug Tests (Temporary)</h3>
            <div className="space-x-2">
              <button 
                onClick={async () => {
                  console.log('Testing database connection...')
                  try {
                    const { data, error } = await supabase
                      .from('personas')
                      .select('*')
                      .eq('project_id', DEMO_PROJECT_ID)
                    console.log('Database test result:', { data, error })
                    alert(error ? `❌ Database Error: ${error.message}` : `✅ Database Success: Found ${data.length} personas`)
                  } catch (err) {
                    console.error('Database test error:', err)
                    alert(`❌ Database Error: ${err}`)
                  }
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Test Database
              </button>
              <button 
                onClick={async () => {
                  console.log('Testing storage...')
                  try {
                    const testFile = new File(['test'], 'test.csv', { type: 'text/csv' })
                    const { data, error } = await supabase.storage
                      .from('csv-uploads')
                      .upload(`test-${Date.now()}.csv`, testFile)
                    console.log('Storage test result:', { data, error })
                    alert(error ? `❌ Storage Error: ${error.message}` : `✅ Storage Success`)
                    if (data) await supabase.storage.from('csv-uploads').remove([data.path])
                  } catch (err) {
                    console.error('Storage test error:', err)
                    alert(`❌ Storage Error: ${err}`)
                  }
                }}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Test Storage
              </button>
              <button 
                onClick={async () => {
                  console.log('Testing N8N webhook...')
                  try {
                    const response = await fetch('/api/n8n/test', { method: 'POST' })
                    const result = await response.json()
                    console.log('N8N test result:', result)
                    alert(result.success ? `✅ N8N Success: ${result.message}` : `❌ N8N Error: ${result.message}`)
                  } catch (err) {
                    console.error('N8N test error:', err)
                    alert(`❌ N8N Error: ${err}`)
                  }
                }}
                className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
              >
                Test N8N
              </button>
              <button 
                onClick={async () => {
                  console.log('Testing Google Sheets...')
                  try {
                    const response = await fetch('/api/sheets/import?test=true')
                    const result = await response.json()
                    console.log('Sheets test result:', result)
                    alert(result.success ? `✅ Sheets Success: ${result.message}` : `❌ Sheets Error: ${result.message}`)
                  } catch (err) {
                    console.error('Sheets test error:', err)
                    alert(`❌ Sheets Error: ${err}`)
                  }
                }}
                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
              >
                Test Sheets
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Top Section - Data Source Selection and Personas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
            {/* Data Source Selection */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setActiveView('upload')}
                variant={activeView === 'upload' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                CSV Upload
              </Button>
              <Button 
                onClick={() => setActiveView('sheets')}
                variant={activeView === 'sheets' ? 'default' : 'outline'}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Google Sheets
              </Button>
            </div>

            {/* Personas List */}
            <Card>
              <CardHeader>
                <CardTitle>Personas</CardTitle>
                <CardDescription>Your audience segments</CardDescription>
              </CardHeader>
              <CardContent>
                
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
                  ) : personas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No personas yet</p>
                  ) : (
                    personas.map((persona) => (
                      <div key={persona.id} className="flex items-center gap-2">
                        <Button
                          variant={selectedPersona?.id === persona.id ? 'default' : 'ghost'}
                          className="flex-1 justify-start"
                          onClick={() => {
                            setSelectedPersona(persona)
                            setActiveView('chat')
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {persona.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePersona(persona.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Upload/Import Section */}
            <div className="lg:col-span-3">
              {activeView === 'upload' ? (
                <FileUpload 
                  projectId={DEMO_PROJECT_ID}
                  onUploadComplete={handleUploadComplete}
                />
              ) : activeView === 'sheets' ? (
                <SheetsImport 
                  projectId={DEMO_PROJECT_ID}
                  onImportComplete={handleUploadComplete}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Select upload method or choose a persona below</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Content Area - Chat */}
          {selectedPersona && (
            <div className="w-full">
              <PersonaChat persona={selectedPersona} />
            </div>
          )}
        </div>
      </div>
      <DebugPanel />
      <SimpleTest />
    </div>
  )
}