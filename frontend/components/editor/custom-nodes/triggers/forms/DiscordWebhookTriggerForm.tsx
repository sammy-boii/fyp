'use client'

import { MessageSquare } from 'lucide-react'

export function DiscordWebhookTriggerForm() {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center space-y-4'>
      <div className='p-4 rounded-full bg-primary/10'>
        <MessageSquare className='size-8 text-primary' />
      </div>
      <div className='space-y-2'>
        <h4 className='font-medium'>Discord Message Trigger</h4>
        <p className='text-sm text-muted-foreground max-w-xs'>
          This trigger starts the workflow when a new message is sent in a
          Discord channel where your bot is present.
        </p>
      </div>
    </div>
  )
}
