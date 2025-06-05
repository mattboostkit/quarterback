'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Play, FileText, Target, TrendingUp, XCircle, Radio } from 'lucide-react'
import { QueryTemplate, QUERY_TEMPLATES, getTemplatesByCategory, processTemplate } from '@/data/queryTemplates'

interface QueryTemplatePanelProps {
  onRunQuery: (query: string, templateTitle: string) => void
  isLoading?: boolean
}

const categoryIcons = {
  content_analysis: FileText,
  purchase_behavior: TrendingUp, 
  campaign_ideas: Target,
  content_avoidance: XCircle,
  media_planning: Radio
}

const categoryLabels = {
  content_analysis: 'Content Analysis',
  purchase_behavior: 'Purchase Behavior',
  campaign_ideas: 'Campaign Ideas', 
  content_avoidance: 'Content Avoidance',
  media_planning: 'Media Planning'
}

const categoryColors = {
  content_analysis: 'bg-blue-100 text-blue-800',
  purchase_behavior: 'bg-green-100 text-green-800',
  campaign_ideas: 'bg-purple-100 text-purple-800',
  content_avoidance: 'bg-red-100 text-red-800',
  media_planning: 'bg-orange-100 text-orange-800'
}

export function QueryTemplatePanel({ onRunQuery, isLoading }: QueryTemplatePanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['campaign_ideas']))
  const [variables, setVariables] = useState<Record<string, string>>({})

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const runTemplate = (template: QueryTemplate) => {
    const processedQuery = processTemplate(template, variables)
    onRunQuery(processedQuery, template.title)
  }

  const updateVariable = (templateId: string, variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [`${templateId}_${variable}`]: value
    }))
  }

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Professional Query Templates
        </CardTitle>
        <CardDescription>
          Pre-built queries designed for audience insights and campaign planning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {categories.map(category => {
          const templates = getTemplatesByCategory(category)
          const Icon = categoryIcons[category]
          const isExpanded = expandedCategories.has(category)
          
          return (
            <div key={category} className="border rounded-lg">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{categoryLabels[category]}</span>
                  <Badge className={categoryColors[category]}>
                    {templates.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t bg-gray-50/50">
                  {templates.map(template => (
                    <div key={template.id} className="p-3 border-b last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{template.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => runTemplate(template)}
                          disabled={isLoading}
                          className="ml-2 h-7 px-2"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                      </div>
                      
                      {/* Variable inputs for templates that need them */}
                      {template.variables && template.variables.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {template.variables.map(variable => (
                            <div key={variable} className="flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-700 min-w-0 flex-shrink-0">
                                {variable}:
                              </label>
                              <input
                                type="text"
                                placeholder={variable === 'BRAND' ? 'Honda' : variable === 'RIGHTSHOLDER' ? 'Brighton & Hove Albion' : `Enter ${variable.toLowerCase()}`}
                                value={variables[`${template.id}_${variable}`] || ''}
                                onChange={(e) => updateVariable(template.id, variable, e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Preview of template */}
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Preview query
                        </summary>
                        <div className="mt-1 p-2 bg-white border rounded text-xs text-gray-600">
                          {processTemplate(template, 
                            Object.fromEntries(
                              (template.variables || []).map(v => [v, variables[`${template.id}_${v}`] || `{${v}}`])
                            )
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}