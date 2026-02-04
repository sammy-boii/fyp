'use client'

import { NodeAction } from '@/types/node.types'
import { Sparkles } from 'lucide-react'
import { AIPromptForm } from './forms/AIPromptForm'
import { aiPromptFormSchema } from '@/schema/nodes/ai.schema'

export const AI_NODE_ACTION_ID = {
  ASK_AI: 'ask_ai'
} as const

export const AI_ACTIONS: NodeAction[] = [
  {
    id: AI_NODE_ACTION_ID.ASK_AI,
    label: 'Ask AI',
    description: 'Send a prompt to AI and get a response',
    icon: Sparkles,
    requiresCredential: false,
    configForm: <AIPromptForm />,
    configFormSchema: aiPromptFormSchema
  }
]
