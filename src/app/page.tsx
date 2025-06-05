'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/FileUpload'
import { PersonaChat } from '@/components/PersonaChat'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, MessageSquare } from 'lucide-react'

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
  const [activeView, setActiveView] = useState<'upload' | 'chat'>('upload')
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
    // Trigger enrichment
    try {
      const response = await fetch('/api/personas/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId })
      })
      
      if (!response.ok) throw new Error('Enrichment failed')
      
      // Reload personas
      await loadPersonas()
      
      // Select the new persona
      const newPersona = personas.find(p => p.id === personaId)
      if (newPersona) {
        setSelectedPersona(newPersona)
        setActiveView('chat')
      }
    } catch (error) {
      console.error('Enrichment error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Quarterback</h1>
          <p className="text-gray-600 mt-2">AI-Powered Audience Persona Insights</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Personas</CardTitle>
                <CardDescription>Your audience segments</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveView('upload')}
                  variant="outline"
                  className="w-full mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
                
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-gray-500 text-center py-2">Loading...</p>
                  ) : personas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No personas yet</p>
                  ) : (
                    personas.map((persona) => (
                      <Button
                        key={persona.id}
                        variant={selectedPersona?.id === persona.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedPersona(persona)
                          setActiveView('chat')
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {persona.name}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeView === 'upload' ? (
              <FileUpload 
                projectId={DEMO_PROJECT_ID}
                onUploadComplete={handleUploadComplete}
              />
            ) : selectedPersona ? (
              <PersonaChat persona={selectedPersona} />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a persona to start chatting</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}