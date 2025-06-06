import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personaId, conversationId, query } = body
    
    console.log('Query persona request:', { personaId, conversationId, query })

    // Validate inputs
    if (!personaId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: personaId and query' },
        { status: 400 }
      )
    }

    // Get persona data
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (personaError) {
      console.error('Error fetching persona:', personaError)
      throw personaError
    }

    // Get recent conversation history if conversationId provided
    let messages = []
    if (conversationId) {
      const { data: messageData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        // Continue without messages rather than failing
      } else {
        messages = messageData || []
      }
    }

    // Build context for OpenAI
    const context = buildPersonaContext(persona, messages.reverse())

    // Call OpenAI API
    const response = await queryOpenAI(context, query)

    return NextResponse.json({ 
      success: true,
      response,
      personaName: persona.name
    })

  } catch (error: any) {
    console.error('Query persona error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to query persona' },
      { status: 500 }
    )
  }
}

function buildPersonaContext(persona: any, messages: any[]): string {
  // Extract key data from persona
  const demographics = persona.demographics || {}
  const rawData = persona.raw_data || []
  
  // Build comprehensive context
  let context = `You are responding as the "${persona.name}" persona. This persona represents a specific audience segment with these characteristics:

Demographics:
- ${demographics.percentage || 'Unknown %'} of the total audience
- ${demographics.genderSplit || 'Mixed gender'}
- ${demographics.devicePreference || 'Various devices'}

Summary: ${persona.summary || 'No summary available'}

Key Data Points:`

  // Add categorized data from raw_data
  const categories: Record<string, string[]> = {}
  rawData.forEach((item: any) => {
    const category = item.Category || 'Other'
    if (!categories[category]) categories[category] = []
    categories[category].push(item.Value)
  })

  Object.entries(categories).forEach(([category, values]) => {
    if (values.length > 0) {
      context += `\n${category}: ${values.slice(0, 10).join(', ')}${values.length > 10 ? '...' : ''}`
    }
  })

  context += `

Instructions:
1. Always respond from the perspective of this specific audience segment
2. Use "we" and "our" to represent the collective voice of this audience
3. Be specific and reference the actual data points when relevant
4. Avoid generic responses - tailor everything to this audience's characteristics
5. If asked about preferences, purchases, or behaviors, ground your response in the data
6. Be direct and factual without unnecessary praise or encouragement
7. For marketing/campaign questions, suggest strategies that would genuinely resonate with this audience

Previous conversation:`

  messages.forEach(msg => {
    context += `\n${msg.role}: ${msg.content}`
  })

  return context
}

async function queryOpenAI(context: string, query: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}