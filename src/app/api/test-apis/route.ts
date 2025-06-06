import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { googleSheetsService } from '@/lib/googleSheets'
import { n8nService } from '@/lib/n8n'

export async function GET() {
  const results = {
    supabase: { status: 'unknown', error: null as any },
    googleSheets: { status: 'unknown', error: null as any },
    n8n: { status: 'unknown', error: null as any },
    openai: { status: 'unknown', error: null as any }
  }

  // Test Supabase
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1)
    
    if (error) {
      results.supabase.status = 'error'
      results.supabase.error = error.message
    } else {
      results.supabase.status = 'ok'
    }
  } catch (err: any) {
    results.supabase.status = 'error'
    results.supabase.error = err.message
  }

  // Test Google Sheets
  try {
    const testResult = await googleSheetsService.testConnection()
    results.googleSheets.status = testResult.success ? 'ok' : 'error'
    results.googleSheets.error = testResult.success ? null : testResult.message
  } catch (err: any) {
    results.googleSheets.status = 'error'
    results.googleSheets.error = err.message
  }

  // Test N8N
  try {
    const testResult = await n8nService.testWebhook()
    results.n8n.status = testResult.success ? 'ok' : 'error'
    results.n8n.error = testResult.success ? null : testResult.message
  } catch (err: any) {
    results.n8n.status = 'error'
    results.n8n.error = err.message
  }

  // Test OpenAI
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      results.openai.status = 'error'
      results.openai.error = 'API key not configured'
    } else {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      
      if (response.ok) {
        results.openai.status = 'ok'
      } else {
        const error = await response.json()
        results.openai.status = 'error'
        results.openai.error = error.error?.message || response.statusText
      }
    }
  } catch (err: any) {
    results.openai.status = 'error'
    results.openai.error = err.message
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGoogleSheetsKey: !!process.env.GOOGLE_SHEETS_API_KEY,
      hasN8NWebhook: !!process.env.N8N_WEBHOOK_URL
    }
  })
}