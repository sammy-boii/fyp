'use client'

import { NodeAction } from '@/types/node.types'
import { Mail, Search, Trash2 } from 'lucide-react'
import { SendEmailForm } from './forms/SendEmailForm'
import { ReadEmailForm } from './forms/ReadEmailForm'
import { DeleteEmailForm } from './forms/DeleteEmailForm'
import {
  sendEmailFormSchema,
  readEmailFormSchema,
  deleteEmailFormSchema
} from '@/schema/nodes/gmail.schema'
import { NODE_ACTION_ID } from '@shared/constants'

export const GMAIL_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.GMAIL.SEND_EMAIL,
    label: 'Send Email',
    description: 'Send an email through Gmail',
    icon: Mail,
    configForm: <SendEmailForm />,
    configFormSchema: sendEmailFormSchema
  },
  {
    id: NODE_ACTION_ID.GMAIL.READ_EMAIL,
    label: 'Read Emails',
    description: 'Read emails from Gmail inbox',
    icon: Search,
    configForm: <ReadEmailForm />,
    configFormSchema: readEmailFormSchema
  },
  {
    id: NODE_ACTION_ID.GMAIL.DELETE_EMAIL,
    label: 'Move to Trash',
    description: 'Move a Gmail message to trash',
    icon: Trash2,
    configForm: <DeleteEmailForm />,
    configFormSchema: deleteEmailFormSchema
  }
]
