'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Send, ChevronDown } from 'lucide-react'

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

const QUERY_TEMPLATES = [
  {
    label: "Content Preferences",
    query: "Please expand explicitly on the types of content this group likes to consume"
  },
  {
    label: "Purchase Motivators",
    query: "Please expand explicitly on the purchasing motivators for automotive products for this group (endorsements, prestige, price, technical spec, early adoption, etc)"
  },
  {
    label: "Content Dislikes",
    query: "Please expand explicitly on the types of content this group are dismissive of, or do not like to engage with or consume"
  },
  {
    label: "Campaign Ideas - Audi x Spurs",
    query: "Please give specific content ideas for an automotive brand (Audi) that sponsors Tottenham Hotspur to engage this audience group effectively on social media and drive affinity and interest in the brand products"
  },
  {
    label: "Ad Formats & Channels",
    query: "I'm creating a digital marketing campaign for Audi as part of their Tottenham sponsorship. Tell me what ad formats, channels and content types this audience are most likely to engage with"
  }
]

export function PersonaChat({ persona }: { persona: Persona }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
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
      // Create a new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          persona_id: persona.id,
          user_id: '33333333-3333-3333-3333-333333333333', // Demo user UUID
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

      // In production, this would call an Edge Function
      // For now, we'll simulate a response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: generateMockResponse(messageText, persona),
        created_at: new Date().toISOString()
      }

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat with {persona.name}</CardTitle>
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
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm"
            >
              Query Templates <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </Button>
            {showTemplates && (
              <div className="mt-2 space-y-1">
                {QUERY_TEMPLATES.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs mr-2 mb-1"
                    onClick={() => {
                      setInput(template.query)
                      setShowTemplates(false)
                    }}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
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
  )
}