export interface QueryTemplate {
  id: string
  category: 'content_analysis' | 'purchase_behavior' | 'campaign_ideas' | 'content_avoidance' | 'media_planning'
  title: string
  description: string
  template: string
  variables?: string[]
  priority: number
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  // Content Analysis Queries
  {
    id: 'content_preferences_detailed',
    category: 'content_analysis',
    title: 'Content Preferences Deep Dive',
    description: 'Detailed analysis of content types this audience engages with',
    template: 'Please expand explicitly on the types of content this group like to consume, including specific formats, platforms, and content styles that drive the highest engagement.',
    priority: 1
  },
  {
    id: 'content_dismissal',
    category: 'content_avoidance', 
    title: 'Content Turn-offs & Avoidance',
    description: 'Content types that negatively impact brand perception',
    template: 'Please expand explicitly on the types of content this group are dismissive of, or do not like to engage with or consume. Include specific examples that would damage brand perception.',
    priority: 2
  },

  // Purchase Behavior Analysis
  {
    id: 'purchase_motivators_automotive',
    category: 'purchase_behavior',
    title: 'Automotive Purchase Motivators',
    description: 'Key drivers for automotive purchasing decisions',
    template: 'Please expand explicitly on the purchasing motivators for automotive products for this group. Focus on endorsements, prestige, price sensitivity, technical specifications, early adoption appeal, environmental factors, and brand heritage importance.',
    priority: 1
  },
  {
    id: 'purchase_motivators_general',
    category: 'purchase_behavior', 
    title: 'General Purchase Motivators',
    description: 'Broader purchasing decision factors across categories',
    template: 'Please expand explicitly on the purchasing motivators for {PRODUCT_CATEGORY} for this group, including endorsements, prestige factors, price sensitivity, technical specifications, early adoption appeal, and other key decision drivers.',
    variables: ['PRODUCT_CATEGORY'],
    priority: 2
  },

  // Campaign Ideas
  {
    id: 'campaign_ideas_honda_brighton',
    category: 'campaign_ideas',
    title: 'Honda x Brighton Campaign Ideas',
    description: 'Specific content ideas for Honda sponsorship of Brighton & Hove Albion',
    template: 'Please give specific content ideas for Honda as part of their sponsorship of Brighton & Hove Albion to engage this audience group effectively on social media and drive affinity and interest in Honda vehicles. Focus on formats, channels, and messaging that align with this audience\'s preferences.',
    priority: 1
  },
  {
    id: 'campaign_ideas_custom',
    category: 'campaign_ideas',
    title: 'Custom Brand Campaign Ideas', 
    description: 'Tailored campaign concepts for specific brand partnerships',
    template: 'Please give specific content ideas for {BRAND} as part of their sponsorship of {RIGHTSHOLDER} to engage this audience group effectively on social media and drive affinity and interest in {BRAND} products. Consider the audience\'s content preferences and engagement triggers.',
    variables: ['BRAND', 'RIGHTSHOLDER'],
    priority: 2
  },

  // Media Planning
  {
    id: 'media_planning_honda',
    category: 'media_planning',
    title: 'Honda Media Planning Recommendations',
    description: 'Optimal channels and formats for Honda campaigns',
    template: 'I\'m creating a digital marketing campaign for Honda as part of their Brighton & Hove Albion sponsorship. Tell me what ad formats, channels and content types this audience are most likely to engage with, including specific platform recommendations and timing considerations.',
    priority: 1
  },
  {
    id: 'media_planning_custom',
    category: 'media_planning',
    title: 'Custom Media Planning',
    description: 'Platform and format recommendations for specific brands',
    template: 'I\'m creating a digital marketing campaign for {BRAND} as part of their {RIGHTSHOLDER} sponsorship. Tell me what ad formats, channels and content types this audience are most likely to engage with, including platform-specific recommendations.',
    variables: ['BRAND', 'RIGHTSHOLDER'],
    priority: 2
  },

  // Advanced Analysis
  {
    id: 'influencer_recommendations',
    category: 'campaign_ideas',
    title: 'Influencer & Partnership Recommendations',
    description: 'Key figures and partnerships that resonate with this audience',
    template: 'Based on this audience\'s influencer preferences and media consumption habits, recommend specific influencers, media personalities, or partnership opportunities that would be most effective for a Honda x Brighton & Hove Albion campaign.',
    priority: 3
  },
  {
    id: 'creative_tone_guidance',
    category: 'content_analysis',
    title: 'Creative Tone & Messaging Guidelines',
    description: 'Optimal tone of voice and messaging approach',
    template: 'Provide specific guidance on the optimal tone of voice, messaging style, and creative approach for reaching this audience. Include what language patterns work best and what to avoid.',
    priority: 3
  },
  {
    id: 'competitive_analysis',
    category: 'purchase_behavior',
    title: 'Competitive Brand Preferences',
    description: 'Analysis of competitive brand preferences and switching triggers',
    template: 'Analyze this audience\'s relationship with competing automotive brands. What would motivate them to switch from their current preferred brands to Honda? Include specific competitive advantages to emphasize.',
    priority: 3
  }
]

export const getTemplatesByCategory = (category: QueryTemplate['category']) => {
  return QUERY_TEMPLATES
    .filter(template => template.category === category)
    .sort((a, b) => a.priority - b.priority)
}

export const getTemplateById = (id: string) => {
  return QUERY_TEMPLATES.find(template => template.id === id)
}

export const processTemplate = (template: QueryTemplate, variables: Record<string, string> = {}) => {
  let processedTemplate = template.template
  
  if (template.variables) {
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`
      processedTemplate = processedTemplate.replace(new RegExp(`{${variable}}`, 'g'), value)
    })
  }
  
  return processedTemplate
}