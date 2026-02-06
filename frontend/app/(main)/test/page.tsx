'use client'

import WorkflowLoader from '@/components/animation/WorkflowLoader'

export default function TestPage() {
  return (
    <div className='w-full h-screen flex items-center justify-center bg-background'>
      <WorkflowLoader text='BUILDING WORKFLOW' />
    </div>
  )
}
