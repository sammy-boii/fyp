'use client'

import { Mail } from 'lucide-react'

export function GmailWebhookTriggerForm() {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center space-y-4'>
      <div className='p-4 rounded-full bg-primary/10'>
        <Mail className='size-8 text-primary' />
      </div>
      <div className='space-y-2'>
        <h4 className='font-medium'>Gmail Webhook Trigger</h4>
        <p className='text-sm text-muted-foreground max-w-xs'>
          This trigger starts the workflow when a new email arrives in your
          Gmail inbox.
        </p>
      </div>
    </div>
  )
}
