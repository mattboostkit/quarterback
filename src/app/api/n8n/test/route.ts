import { NextRequest, NextResponse } from 'next/server'
import { n8nService } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing N8N webhook connectivity...')
    
    const result = await n8nService.testWebhook()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
      webhookUrl: process.env.N8N_WEBHOOK_URL || 'Not configured'
    })
    
  } catch (error) {
    console.error('N8N test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'N8N Test Endpoint',
    webhookConfigured: !!process.env.N8N_WEBHOOK_URL,
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'Not configured',
    timestamp: new Date().toISOString()
  })
}