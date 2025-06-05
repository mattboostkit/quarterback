// N8N Integration Service for Quarterback

export interface N8NWebhookPayload {
  event: 'persona_created' | 'persona_enriched' | 'query_completed' | 'report_generated'
  timestamp: string
  data: {
    personaId?: string
    projectId?: string
    clientId?: string
    userId?: string
    metadata?: Record<string, any>
  }
}

export interface PersonaCreatedPayload extends N8NWebhookPayload {
  event: 'persona_created'
  data: {
    personaId: string
    projectId: string
    clientId: string
    personaName: string
    csvData: any[]
    rawDataPoints: number
    status: 'created' | 'processing'
    metadata: {
      uploadedAt: string
      fileName?: string
      fileSize?: number
    }
  }
}

export interface PersonaEnrichedPayload extends N8NWebhookPayload {
  event: 'persona_enriched'
  data: {
    personaId: string
    projectId: string
    enrichmentResults: {
      contentPreferences?: string[]
      purchaseMotivators?: string[]
      campaignIdeas?: string[]
      contentAvoidance?: string[]
      demographics?: Record<string, any>
    }
    llmProvider: 'openai' | 'gemini' | 'claude'
    processingTime: number
    metadata: {
      enrichedAt: string
      confidence: number
      tokensUsed?: number
    }
  }
}

export interface QueryCompletedPayload extends N8NWebhookPayload {
  event: 'query_completed'
  data: {
    personaId: string
    queryType: string
    queryTemplate: string
    response: string
    responseLength: number
    metadata: {
      completedAt: string
      processingTime: number
      userSatisfaction?: number
    }
  }
}

class N8NService {
  private webhookUrl: string | null

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || null
  }

  private async sendWebhook(payload: N8NWebhookPayload): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('N8N webhook URL not configured, skipping webhook call')
      return false
    }

    try {
      console.log(`Sending ${payload.event} event to N8N:`, {
        url: this.webhookUrl,
        event: payload.event,
        personaId: payload.data.personaId
      })

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Quarterback-Platform/1.0'
        },
        body: JSON.stringify({
          ...payload,
          source: 'quarterback',
          version: '1.0'
        })
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.text()
      console.log('N8N webhook success:', result)
      return true

    } catch (error) {
      console.error('Failed to send N8N webhook:', error)
      // Don't throw - webhook failures shouldn't break the main flow
      return false
    }
  }

  async notifyPersonaCreated(payload: Omit<PersonaCreatedPayload, 'event' | 'timestamp'>): Promise<boolean> {
    return this.sendWebhook({
      event: 'persona_created',
      timestamp: new Date().toISOString(),
      ...payload
    })
  }

  async notifyPersonaEnriched(payload: Omit<PersonaEnrichedPayload, 'event' | 'timestamp'>): Promise<boolean> {
    return this.sendWebhook({
      event: 'persona_enriched', 
      timestamp: new Date().toISOString(),
      ...payload
    })
  }

  async notifyQueryCompleted(payload: Omit<QueryCompletedPayload, 'event' | 'timestamp'>): Promise<boolean> {
    return this.sendWebhook({
      event: 'query_completed',
      timestamp: new Date().toISOString(),
      ...payload
    })
  }

  async notifyReportGenerated(payload: Omit<N8NWebhookPayload, 'event' | 'timestamp'>): Promise<boolean> {
    return this.sendWebhook({
      event: 'report_generated',
      timestamp: new Date().toISOString(),
      ...payload
    })
  }

  // Test webhook connectivity
  async testWebhook(): Promise<{ success: boolean; message: string }> {
    if (!this.webhookUrl) {
      return { success: false, message: 'N8N webhook URL not configured' }
    }

    try {
      const testPayload: N8NWebhookPayload = {
        event: 'persona_created',
        timestamp: new Date().toISOString(),
        data: {
          personaId: 'test-persona-id',
          projectId: 'test-project-id',
          clientId: 'test-client-id',
          metadata: {
            test: true,
            message: 'Quarterback webhook connectivity test'
          }
        }
      }

      const success = await this.sendWebhook(testPayload)
      return {
        success,
        message: success ? 'Webhook test successful' : 'Webhook test failed'
      }
    } catch (error) {
      return {
        success: false,
        message: `Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const n8nService = new N8NService()

// Types are already exported above with their definitions