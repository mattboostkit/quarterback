import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { personaId } = await request.json()

    // Fetch persona data
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (fetchError || !persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Create enrichment prompt
    const prompt = `I'm going to upload a CSV file which has a number of categorised data points about an audience segment. Based on this data, create a detailed persona that represents this audience.

Analyze the following data and create a persona profile:
${JSON.stringify(persona.raw_data, null, 2)}

Provide:
1. A name for this persona
2. Demographics summary
3. Key characteristics and behaviors
4. Content preferences
5. Purchase motivators
6. Marketing recommendations

Format the response as JSON with these keys: name, demographics, characteristics, contentPreferences, purchaseMotivators, marketingRecommendations`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert market researcher creating detailed audience personas.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const aiResponse = await response.json()
    const enrichedData = JSON.parse(aiResponse.choices[0].message.content)

    // Update persona with enriched data
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        name: enrichedData.name || persona.name,
        enriched_data: enrichedData,
        summary: enrichedData.characteristics?.join(' ') || 'Persona enriched',
        demographics: enrichedData.demographics
      })
      .eq('id', personaId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, enrichedData })

  } catch (error) {
    console.error('Enrichment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment failed' },
      { status: 500 }
    )
  }
}