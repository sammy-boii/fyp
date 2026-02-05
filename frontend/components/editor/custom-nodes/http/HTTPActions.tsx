'use client'

import { NodeAction } from '@/types/node.types'
import { Globe } from 'lucide-react'
import { HTTPRequestForm } from './forms/HTTPRequestForm'
import { httpRequestFormSchema } from '@/schema/nodes/http.schema'
import { NODE_ACTION_ID } from '@shared/constants'

// Re-export for backwards compatibility with existing code
export const HTTP_NODE_ACTION_ID = NODE_ACTION_ID.HTTP

export const HTTP_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.HTTP.HTTP_REQUEST,
    label: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    icon: Globe,
    requiresCredential: false,
    configForm: <HTTPRequestForm />,
    configFormSchema: httpRequestFormSchema
  }
]
