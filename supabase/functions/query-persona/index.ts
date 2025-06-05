import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { personaId, conversationId, query } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get persona data
    const { data: persona, error: personaError } = await supabaseClient
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (personaError) throw personaError

    // Get recent conversation history
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (messagesError) throw messagesError

    // Build context for LLM
    const context = buildPersonaContext(persona, messages.reverse())

    // Call OpenAI API
    const response = await queryOpenAI(context, query)

    // Save the exchange to database
    await supabaseClient
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: query
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: response
        }
      ])

    return new Response(
      JSON.stringify({ 
        success: true,
        response,
        personaName: persona.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function buildPersonaContext(persona: any, messages: any[]): string {
  let context = `You are responding as the "${persona.name}" persona. 
  This persona has been created from audience data with the following characteristics:
  ${JSON.stringify(persona.enriched_data || persona.raw_data, null, 2)}
  
  You must always respond from the perspective of this audience segment.
  Be direct and factual without praise or encouragement.
  
  Previous conversation:
  `
  
  messages.forEach(msg => {
    context += `\n${msg.role}: ${msg.content}`
  })
  
  return context
}

async function queryOpenAI(context: string, query: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiKey) {
    // Return mock response if no API key
    return generateMockResponse(query)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API error:', error)
    return generateMockResponse(query)
  }
}

function generateMockResponse(query: string): string {
  // Fallback mock responses for demo purposes
  const lowercaseQuery = query.toLowerCase()
  
  if (lowercaseQuery.includes('content') && lowercaseQuery.includes('prefer')) {
    return `Based on our audience data, we prefer substantive, well-researched content that respects our intelligence. We engage with long-form journalism, data-driven analysis, and content that provides genuine insights rather than surface-level information.`
  }
  
  if (lowercaseQuery.includes('campaign') || lowercaseQuery.includes('marketing')) {
    return `For marketing campaigns targeting our segment, focus on authenticity and substance. We respond better to campaigns that demonstrate genuine expertise and innovation rather than flashy but empty messaging. Consider using data visualizations, case studies, and behind-the-scenes content that shows real craftsmanship.`
  }
  
  return `As this persona, I can provide insights based on the audience data. Could you please be more specific about what aspect of this audience segment you'd like to understand better?`
}