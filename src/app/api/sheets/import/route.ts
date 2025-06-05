import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleSheetsService } from '@/lib/googleSheets'
import { n8nService } from '@/lib/n8n'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { personaName, projectId } = await request.json()

    console.log('Importing from Google Sheets:', { personaName, projectId })

    // Get data from Google Sheets
    const sheetsData = await googleSheetsService.getPersonaData(personaName)
    
    if (sheetsData.length === 0) {
      return NextResponse.json(
        { error: 'No persona data found in Google Sheets' },
        { status: 404 }
      )
    }

    const personaData = sheetsData[0] // Use first match

    // Convert to CSV-like format for existing pipeline
    const csvData = googleSheetsService.convertToCSVData(personaData)

    // Create persona in database
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .insert({
        project_id: projectId || '22222222-2222-2222-2222-222222222222',
        name: personaData.audienceName,
        raw_data: csvData,
        summary: personaData.demographics.summary,
        demographics: {
          genderSplit: personaData.demographics.genderSplit,
          devicePreference: personaData.demographics.devicePreference,
          percentage: personaData.percentage
        }
      })
      .select()
      .single()

    if (personaError) {
      console.error('Error creating persona:', personaError)
      throw personaError
    }

    // Notify N8N of persona creation from Google Sheets
    await n8nService.notifyPersonaCreated({
      data: {
        personaId: persona.id,
        projectId: persona.project_id,
        clientId: '11111111-1111-1111-1111-111111111111',
        personaName: persona.name,
        csvData: csvData,
        rawDataPoints: csvData.length,
        status: 'created',
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileName: 'google_sheets_import',
          source: 'google_sheets',
          originalPercentage: personaData.percentage
        }
      }
    })

    return NextResponse.json({
      success: true,
      persona: {
        id: persona.id,
        name: persona.name,
        dataPoints: csvData.length,
        summary: persona.summary,
        demographics: persona.demographics
      },
      sheetsData: {
        audienceName: personaData.audienceName,
        percentage: personaData.percentage,
        totalCategories: Object.keys(personaData).length - 3 // Exclude name, percentage, demographics
      }
    })

  } catch (error) {
    console.error('Sheets import error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Import failed',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const test = url.searchParams.get('test')

    if (test) {
      // Test Google Sheets connection
      const result = await googleSheetsService.testConnection()
      return NextResponse.json(result)
    }

    // List available personas from Google Sheets
    const personas = await googleSheetsService.getPersonaData()
    
    return NextResponse.json({
      success: true,
      available_personas: personas.map(p => ({
        name: p.audienceName,
        percentage: p.percentage,
        summary: p.demographics.summary,
        dataPoints: {
          topics: p.topOnlineTopics.length,
          socialMedia: p.favouriteSocialMedia.length,
          media: p.favouriteMedia.length,
          influencers: p.topInfluencers.length,
          brands: p.favouriteBrands.length,
          total: p.topOnlineTopics.length + p.favouriteSocialMedia.length + p.favouriteMedia.length + p.topInfluencers.length + p.favouriteBrands.length
        }
      })),
      sheetsConfigured: !!process.env.GOOGLE_SHEETS_API_KEY
    })

  } catch (error) {
    console.error('Sheets GET error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to read sheets',
        sheetsConfigured: !!process.env.GOOGLE_SHEETS_API_KEY
      },
      { status: 500 }
    )
  }
}