'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QueryTemplatePanel } from '@/components/QueryTemplatePanel'
import { supabase } from '@/lib/supabase'
import { n8nService } from '@/lib/n8n'
import { Send, MessageSquare, FileText } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type Persona = {
  id: string
  name: string
  raw_data: any
}


export function PersonaChat({ persona }: { persona: Persona }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'templates' | 'chat'>('templates')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  useEffect(() => {
    // Initialize conversation
    initializeConversation()
  }, [persona.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      // Create a new conversation (without user_id for anonymous access)
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          persona_id: persona.id,
          title: `Chat with ${persona.name}`
        })
        .select()
        .single()

      if (error) throw error
      
      setConversationId(data.id)
      
      // Add initial system message
      const systemMessage: Message = {
        id: 'system-1',
        role: 'assistant',
        content: `I am the ${persona.name} persona. I've been created from the audience data you provided. I'll answer all your questions from the perspective of this audience segment. Let me know what you'd like to explore about this audience.`,
        created_at: new Date().toISOString()
      }
      
      setMessages([systemMessage])
    } catch (error) {
      console.error('Error initializing conversation:', error)
    }
  }

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || !conversationId) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Save user message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: messageText
        })

      // Call the API to get response from OpenAI
      const response = await fetch('/api/query-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId: persona.id,
          conversationId: conversationId,
          query: messageText
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage.content
        })

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockResponse = (query: string, persona: Persona): string => {
    // This is a mock response generator - in production, use actual LLM
    if (query.toLowerCase().includes('content') && query.toLowerCase().includes('like')) {
      return `As ${persona.name}, we gravitate towards high-quality, intellectually stimulating content. We appreciate:

• Long-form journalism from reputable sources like The Guardian and BBC
• Documentary-style video content that provides depth and context
• Satirical content with intelligent humor (think Private Eye, Charlie Brooker)
• Data-driven analysis and infographics
• Behind-the-scenes content that shows expertise and craftsmanship

We're particularly drawn to content that respects our intelligence and provides genuine value rather than superficial entertainment.`
    }

    if (query.toLowerCase().includes('purchase') && query.toLowerCase().includes('motivator')) {
      return `For automotive purchases, our key motivators as ${persona.name} include:

• **Technical Innovation**: We value cutting-edge technology, especially sustainability features
• **Build Quality**: Premium materials and attention to detail matter significantly
• **Brand Heritage**: Established reputation for reliability and engineering excellence
• **Practical Luxury**: Features that enhance daily life, not just status symbols
• **Environmental Impact**: Increasingly important - hybrid/electric options preferred
• **Total Cost of Ownership**: We look beyond sticker price to long-term value

Prestige alone won't sway us - we need substance behind the badge.`
    }

    return `As the ${persona.name} persona, I understand your query about "${query}". Based on our audience characteristics, we value authentic, intelligent engagement over superficial marketing. 

Would you like me to elaborate on any specific aspect of how this audience segment would respond to your campaign or content strategy?`
  }

  const handleTemplateQuery = async (query: string, templateTitle: string) => {
    setActiveTab('chat')
    const startTime = Date.now()
    
    // Send the message and get the response
    await sendMessage(query)
    
    // Notify N8N of query completion (after message is sent)
    setTimeout(async () => {
      try {
        await n8nService.notifyQueryCompleted({
          data: {
            personaId: persona.id,
            queryType: templateTitle,
            queryTemplate: query,
            response: messages[messages.length - 1]?.content || 'Generated response',
            responseLength: messages[messages.length - 1]?.content.length || 0,
            metadata: {
              completedAt: new Date().toISOString(),
              processingTime: Date.now() - startTime
            }
          }
        })
      } catch (error) {
        console.error('Failed to notify N8N of query completion:', error)
      }
    }, 2000) // Wait for message to be processed
  }

  return (
    <div className="space-y-6">
      {/* Query Templates Panel */}
      <div>
        <QueryTemplatePanel 
          onRunQuery={handleTemplateQuery}
          isLoading={loading}
        />
      </div>

      {/* Chat Interface */}
      <div>
        <Card className="h-[500px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat with {persona.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'templates' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('templates')}
                  className="lg:hidden"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Templates
                </Button>
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="lg:hidden"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask about this audience segment..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}