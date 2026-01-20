'use client'

import { NodeAction } from '@/types/node.types'
import { Mail, Search } from 'lucide-react'
import { SendEmailForm } from './forms/SendEmailForm'
import { ReadEmailForm } from './forms/ReadEmailForm'
import {
  sendEmailFormSchema,
  readEmailFormSchema
} from '@/schema/nodes/gmail.schema'
import { NODE_ACTION_ID } from '@shared/constants'

export const GMAIL_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.SEND_EMAIL,
    label: 'Send Email',
    description: 'Send an email through Gmail',
    icon: Mail,
    configForm: <SendEmailForm />,
    configFormSchema: sendEmailFormSchema
  },
  {
    id: NODE_ACTION_ID.READ_EMAIL,
    label: 'Read Emails',
    description: 'Read emails from Gmail inbox',
    icon: Search,
    configForm: <ReadEmailForm />,
    configFormSchema: readEmailFormSchema
  }
]
