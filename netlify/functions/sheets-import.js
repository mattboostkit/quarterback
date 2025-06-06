const { createClient } = require('@supabase/supabase-js')

// Simple Google Sheets integration for Netlify Functions
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // Debug environment variables (remove sensitive parts)
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleKey: !!process.env.GOOGLE_SHEETS_API_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Missing Supabase configuration',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
          }
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (event.httpMethod === 'GET') {
      // Return mock data for MVP
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          available_personas: [
            {
              name: "Informed Professionals",
              percentage: "14%",
              summary: "Informed Professional Londoners are deeply engaged in the vibrant life of London, with a keen interest in politics and cultural discourse.",
              dataPoints: {
                topics: 14,
                socialMedia: 5,
                media: 15,
                influencers: 14,
                brands: 10,
                total: 58
              }
            }
          ],
          sheetsConfigured: !!process.env.GOOGLE_SHEETS_API_KEY
        })
      }
    }

    if (event.httpMethod === 'POST') {
      const { personaName, projectId } = JSON.parse(event.body)

      // Create persona with mock data for MVP
      console.log('Creating persona with data:', {
        projectId: projectId || '22222222-2222-2222-2222-222222222222',
        personaName: personaName || 'Informed Professionals'
      })

      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          project_id: projectId || '22222222-2222-2222-2222-222222222222',
          name: personaName || 'Informed Professionals',
          raw_data: [
            { Category: 'Demographics', Type: 'Gender Split', Value: '75% Male', Source: 'Google Sheets' },
            { Category: 'Demographics', Type: 'Device Preference', Value: '62% iOS', Source: 'Google Sheets' },
            { Category: 'Online Topics', Type: 'Preference', Value: 'Politics', Source: 'Google Sheets' },
            { Category: 'Social Media', Type: 'Preference', Value: 'LinkedIn', Source: 'Google Sheets' },
            { Category: 'Media Preferences', Type: 'Preference', Value: 'Guardian', Source: 'Google Sheets' }
          ],
          summary: 'Informed Professional Londoners are deeply engaged in the vibrant life of London, with a keen interest in politics and cultural discourse.',
          demographics: {
            genderSplit: '75% Male',
            devicePreference: '62% iOS',
            percentage: '14%'
          }
        })
        .select()
        .single()

      if (personaError) {
        console.error('Supabase error details:', personaError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Database Error: ' + (personaError.message || 'Failed to create persona'),
            details: personaError.details || 'Check function logs',
            hint: personaError.hint || 'Verify Supabase configuration'
          })
        }
      }

      // Notify N8N webhook
      try {
        const webhookUrl = 'https://n8n.tradescale.ai/webhook/quarterback'
        const webhookPayload = {
          event: 'persona_created',
          timestamp: new Date().toISOString(),
          personaId: persona.id,
          projectId: persona.project_id,
          clientId: '11111111-1111-1111-1111-111111111111',
          personaName: persona.name,
          status: 'created',
          source: 'google_sheets'
        }
        
        console.log('Sending N8N webhook:', webhookPayload)
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        })
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.warn('N8N webhook failed:', webhookResponse.status, errorText)
        } else {
          console.log('N8N webhook successful')
        }
      } catch (webhookError) {
        console.warn('N8N webhook error:', webhookError.message)
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          persona: {
            id: persona.id,
            name: persona.name,
            dataPoints: 5,
            summary: persona.summary,
            demographics: persona.demographics
          }
        })
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Function failed',
        details: 'Check function logs'
      })
    }
  }
}