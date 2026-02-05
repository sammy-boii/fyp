'use client'

import { NodeAction } from '@/types/node.types'
import { Sparkles } from 'lucide-react'
import { AIPromptForm } from './forms/AIPromptForm'
import { aiPromptFormSchema } from '@/schema/nodes/ai.schema'
import { NODE_ACTION_ID } from '@shared/constants'

// Re-export for backwards compatibility with existing code
export const AI_NODE_ACTION_ID = NODE_ACTION_ID.AI

export const AI_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.AI.ASK_AI,
    label: 'Ask AI',
    description: 'Send a prompt to AI and get a response',
    icon: Sparkles,
    requiresCredential: false,
    configForm: <AIPromptForm />,
    configFormSchema: aiPromptFormSchema
  }
]
