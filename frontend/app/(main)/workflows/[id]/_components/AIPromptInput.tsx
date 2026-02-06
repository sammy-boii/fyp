'use client'

import { useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Edge, Node } from '@xyflow/react'
import { BACKEND_URL } from '@/constants'

interface AIWorkflowResponse {
  nodes: Node[]
  edges: Edge[]
  error?: string
}

interface AIPromptInputProps {
  onWorkflowGenerated: (nodes: Node[], edges: Edge[]) => void
  onLoadingChange?: (loading: boolean) => void
  disabled?: boolean
  className?: string
}

export function AIPromptInput({
  onWorkflowGenerated,
  onLoadingChange,
  disabled,
  className
}: AIPromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    onLoadingChange?.(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/generate-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const text = await response.text()
      let data: AIWorkflowResponse

      try {
        data = JSON.parse(text)
      } catch {
        console.error('Invalid JSON response:', text)
        throw new Error('Invalid response from server')
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate workflow')
      }

      if (data.nodes && data.nodes.length > 0) {
        onWorkflowGenerated(data.nodes, data.edges || [])
        setPrompt('')
        toast.success(`Generated workflow with ${data.nodes.length} nodes`)
      } else {
        throw new Error('No nodes generated')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate workflow'
      )
    } finally {
      setIsGenerating(false)
      onLoadingChange?.(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg',
        className
      )}
    >
      <div className='flex items-center gap-2 px-2 text-muted-foreground'>
        <Sparkles className='h-4 w-4 text-primary' />
      </div>
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Describe your workflow... (e.g., "Send an email when I receive a Discord message")'
        className='flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm'
        disabled={disabled || isGenerating}
      />
      <Button
        size='sm'
        onClick={handleGenerate}
        disabled={!prompt.trim() || disabled || isGenerating}
        className='gap-1.5 px-3'
      >
        {isGenerating ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Send className='h-4 w-4' />
        )}
        <span className='sr-only sm:not-sr-only'>Generate</span>
      </Button>
    </div>
  )
}
