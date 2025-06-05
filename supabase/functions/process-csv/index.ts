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
    const { personaId, csvData } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process CSV data into structured format
    const processedData = processCsvData(csvData)

    // Generate initial persona summary using OpenAI
    const summary = await generatePersonaSummary(processedData)

    // Update persona with processed data
    const { error } = await supabaseClient
      .from('personas')
      .update({
        raw_data: processedData,
        enriched_data: {
          summary,
          processed_at: new Date().toISOString(),
          data_points: processedData.length
        },
        summary
      })
      .eq('id', personaId)

    if (error) throw error

    // Trigger N8N webhook if configured
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personaId, 
          status: 'processed',
          dataPoints: processedData.length 
        })
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'CSV processed successfully',
        dataPoints: processedData.length
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

function processCsvData(data: any[]): any {
  // Extract and structure the CSV data based on expected format
  return data.map(row => ({
    ...row,
    processed: true,
    timestamp: new Date().toISOString()
  }))
}

async function generatePersonaSummary(data: any): Promise<string> {
  // In production, this would call OpenAI API
  // For now, return a mock summary
  return `This persona represents a sophisticated audience segment with ${data.length} data points. 
  Key characteristics include professional engagement, high digital literacy, and preference for quality content.`
}