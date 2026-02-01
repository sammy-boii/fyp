'use client'

import { Play } from 'lucide-react'

export function ManualTriggerForm() {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center space-y-4'>
      <div className='p-4 rounded-full bg-primary/10'>
        <Play className='size-8 text-primary' />
      </div>
      <div className='space-y-2'>
        <h4 className='font-medium'>Manual Trigger</h4>
        <p className='text-sm text-muted-foreground max-w-xs'>
          This trigger starts the workflow manually. Click the execute button to
          run the workflow.
        </p>
      </div>
    </div>
  )
}
