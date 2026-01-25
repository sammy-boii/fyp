'use client'

import { ExecutionLog } from '@/hooks/use-workflow-websocket'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Wifi,
  WifiOff,
  Clock,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

interface WorkflowExecutionTabProps {
  isConnected: boolean
  executionLogs: ExecutionLog[]
  currentExecution: {
    id: string
    status: 'running' | 'completed' | 'failed'
    progress?: { current: number; total: number }
  } | null
  clearLogs: () => void
}

const WorkflowExecutionTab = ({
  isConnected,
  executionLogs,
  currentExecution,
  clearLogs
}: WorkflowExecutionTabProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [executionLogs])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'workflow:start':
        return <Play className='h-4 w-4 text-blue-500' />
      case 'node:start':
        return <Loader2 className='h-4 w-4 text-yellow-500 animate-spin' />
      case 'node:complete':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'node:error':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'workflow:complete':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'workflow:error':
        return <XCircle className='h-4 w-4 text-red-500' />
      default:
        return <Zap className='h-4 w-4 text-gray-500' />
    }
  }

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case 'workflow:start':
        return 'default'
      case 'node:start':
        return 'outline'
      case 'node:complete':
        return 'default'
      case 'node:error':
        return 'destructive'
      case 'workflow:complete':
        return 'default'
      case 'workflow:error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getEventLabel = (log: ExecutionLog) => {
    switch (log.type) {
      case 'workflow:start':
        return 'Workflow Started'
      case 'node:start':
        return `Executing ${log.data?.nodeName || log.data?.nodeId || 'node'}`
      case 'node:complete':
        return `Completed ${log.data?.nodeId || 'node'}`
      case 'node:error':
        return `Failed ${log.data?.nodeId || 'node'}`
      case 'workflow:complete':
        return `Workflow Completed (${log.data?.duration}ms)`
      case 'workflow:error':
        return 'Workflow Failed'
      default:
        return log.type
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  return (
    <div className='h-[90vh] flex flex-col p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold'>Execution Log</h2>
          <div className='flex items-center gap-2'>
            {isConnected ? (
              <Badge
                variant='outline'
                className='text-green-600 border-green-600'
              >
                <Wifi className='h-3 w-3 mr-1' />
                Connected
              </Badge>
            ) : (
              <Badge variant='outline' className='text-red-600 border-red-600'>
                <WifiOff className='h-3 w-3 mr-1' />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={clearLogs}
          disabled={executionLogs.length === 0}
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Clear Logs
        </Button>
      </div>

      {/* Progress Bar */}
      {currentExecution &&
        currentExecution.status === 'running' &&
        currentExecution.progress && (
          <Card className='p-4 mb-4 bg-blue-500/10 border-blue-500/30'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                <span className='text-sm font-medium'>Running...</span>
              </div>
              <span className='text-sm text-muted-foreground'>
                {currentExecution.progress.current} /{' '}
                {currentExecution.progress.total} nodes
              </span>
            </div>
            <div className='w-full bg-muted rounded-full h-2'>
              <div
                className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${(currentExecution.progress.current / currentExecution.progress.total) * 100}%`
                }}
              />
            </div>
          </Card>
        )}

      {/* Execution Logs */}
      <Card className='flex-1 overflow-hidden'>
        <ScrollArea className='h-full' ref={scrollRef}>
          <div className='p-4 space-y-2'>
            {executionLogs.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                <Clock className='h-12 w-12 mb-4 opacity-50' />
                <p className='text-sm'>No execution logs yet</p>
                <p className='text-xs mt-1'>
                  Execute the workflow to see live updates
                </p>
              </div>
            ) : (
              executionLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    log.type === 'node:start' &&
                      'bg-yellow-500/5 border-yellow-500/30',
                    log.type === 'node:complete' &&
                      'bg-green-500/5 border-green-500/30',
                    log.type === 'node:error' &&
                      'bg-red-500/5 border-red-500/30',
                    log.type === 'workflow:start' &&
                      'bg-blue-500/5 border-blue-500/30',
                    log.type === 'workflow:complete' &&
                      'bg-green-500/5 border-green-500/30',
                    log.type === 'workflow:error' &&
                      'bg-red-500/5 border-red-500/30',
                    ![
                      'node:start',
                      'node:complete',
                      'node:error',
                      'workflow:start',
                      'workflow:complete',
                      'workflow:error'
                    ].includes(log.type) && 'bg-muted/50'
                  )}
                >
                  <div className='mt-0.5'>{getEventIcon(log.type)}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Badge
                        variant={getEventBadgeVariant(log.type) as any}
                        className='text-xs'
                      >
                        {log.type.replace(':', ' → ').toUpperCase()}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className='text-sm font-medium'>{getEventLabel(log)}</p>
                    {log.data?.error && (
                      <p className='text-xs text-red-500 mt-1 font-mono bg-red-500/10 p-2 rounded'>
                        {log.data.error}
                      </p>
                    )}
                    {log.data?.output && log.type === 'node:complete' && (
                      <details className='mt-2'>
                        <summary className='text-xs text-muted-foreground cursor-pointer hover:text-foreground'>
                          View output
                        </summary>
                        <pre className='text-xs mt-1 p-2 bg-muted rounded overflow-x-auto max-h-40'>
                          {JSON.stringify(log.data.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}

export default WorkflowExecutionTab
