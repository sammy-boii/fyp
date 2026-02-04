'use client'

import { NodeAction } from '@/types/node.types'
import { Globe } from 'lucide-react'
import { HTTPRequestForm } from './forms/HTTPRequestForm'
import { httpRequestFormSchema } from '@/schema/nodes/http.schema'

export const HTTP_NODE_ACTION_ID = {
  HTTP_REQUEST: 'http_request'
} as const

export const HTTP_ACTIONS: NodeAction[] = [
  {
    id: HTTP_NODE_ACTION_ID.HTTP_REQUEST,
    label: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    icon: Globe,
    requiresCredential: false,
    configForm: <HTTPRequestForm />,
    configFormSchema: httpRequestFormSchema
  }
]
