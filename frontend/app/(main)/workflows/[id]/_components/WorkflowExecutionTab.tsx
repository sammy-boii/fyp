'use client'

import { ExecutionLog } from '@/hooks/use-workflow-websocket'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Circle,
  Play,
  Wifi,
  WifiOff,
  Clock,
  ChevronDown,
  Timer,
  AlertCircle,
  FileOutput
} from 'lucide-react'
import { useEffect, useRef, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

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

// Helper to format node name from ID (e.g., "gmail_send_email" -> "Gmail Send Email")
const formatNodeName = (nodeId?: string, nodeName?: string) => {
  if (nodeName) return nodeName
  if (!nodeId) return 'Unknown Node'

  return nodeId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper to format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Group logs by execution
interface ExecutionGroup {
  executionId: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  duration?: number
  logs: ExecutionLog[]
}

const WorkflowExecutionTab = ({
  isConnected,
  executionLogs,
  currentExecution,
  clearLogs
}: WorkflowExecutionTabProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [executionLogs])

  // Group logs by execution ID
  const executionGroups: ExecutionGroup[] = useMemo(() => {
    const groups: Map<string, ExecutionGroup> = new Map()

    executionLogs.forEach((log) => {
      const execId = log.executionId

      if (!groups.has(execId)) {
        groups.set(execId, {
          executionId: execId,
          startTime: log.timestamp,
          status: 'running',
          logs: []
        })
      }

      const group = groups.get(execId)!
      group.logs.push(log)

      if (log.type === 'workflow:complete') {
        group.status = 'completed'
        group.endTime = log.timestamp
        group.duration = log.data?.duration
      } else if (log.type === 'workflow:error') {
        group.status = 'failed'
        group.endTime = log.timestamp
      }
    })

    return Array.from(groups.values()).reverse()
  }, [executionLogs])

  const toggleNodeExpand = (nodeKey: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeKey)) {
        newSet.delete(nodeKey)
      } else {
        newSet.add(nodeKey)
      }
      return newSet
    })
  }

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'workflow:start':
        return <Play className='h-4 w-4 text-blue-500' />
      case 'node:start':
        return <Circle className='h-4 w-4 text-yellow-500' />
      case 'node:complete':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'node:error':
        return <XCircle className='h-4 w-4 text-destructive' />
      case 'workflow:complete':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'workflow:error':
        return <XCircle className='h-4 w-4 text-destructive' />
      default:
        return <Circle className='h-4 w-4 text-muted-foreground' />
    }
  }

  const getStatusBadge = (status: 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'running':
        return (
          <Badge
            variant='outline'
            className='text-yellow-600 border-yellow-600'
          >
            Running
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant='outline' className='text-green-600 border-green-600'>
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge
            variant='outline'
            className='text-destructive border-destructive'
          >
            Failed
          </Badge>
        )
    }
  }

  const renderLogEntry = (log: ExecutionLog, index: number, execId: string) => {
    const nodeKey = `${execId}-${index}`
    const hasOutput =
      log.data?.output && Object.keys(log.data.output).length > 0
    const hasError = !!log.data?.error
    const isExpandable = hasOutput || hasError
    const isExpanded = expandedNodes.has(nodeKey)

    const isWorkflowEvent = log.type.startsWith('workflow:')

    return (
      <div
        key={nodeKey}
        className={cn(
          'relative pl-6 pb-4 last:pb-0',
          isWorkflowEvent && 'pl-4'
        )}
      >
        {/* Timeline connector */}
        <div className='absolute left-[7px] top-6 bottom-0 w-px bg-border last:hidden' />

        {/* Timeline dot */}
        <div className='absolute left-0 top-1.5'>{getStatusIcon(log.type)}</div>

        <div className='ml-4'>
          {/* Event header */}
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-medium'>
              {log.type === 'workflow:start' && 'Workflow Started'}
              {log.type === 'workflow:complete' && 'Workflow Completed'}
              {log.type === 'workflow:error' && 'Workflow Failed'}
              {log.type === 'node:start' &&
                `Executing: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`}
              {log.type === 'node:complete' &&
                `Completed: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`}
              {log.type === 'node:error' &&
                `Failed: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatTime(log.timestamp)}
            </span>
            {log.data?.duration && (
              <Badge variant='secondary' className='text-xs'>
                <Timer className='h-3 w-3 mr-1' />
                {log.data.duration}ms
              </Badge>
            )}
          </div>

          {/* Expandable content for output/error */}
          {isExpandable && (
            <Collapsible
              open={isExpanded}
              onOpenChange={() => toggleNodeExpand(nodeKey)}
              className='mt-2'
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 px-2 text-xs gap-1'
                >
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  {hasError ? (
                    <>
                      <AlertCircle className='h-3 w-3 text-destructive' />
                      View Error
                    </>
                  ) : (
                    <>
                      <FileOutput className='h-3 w-3' />
                      View Output
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div
                  className={cn(
                    'mt-2 p-3 rounded-md text-xs font-mono overflow-x-auto',
                    hasError
                      ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                      : 'bg-muted border'
                  )}
                >
                  {hasError ? (
                    <pre className='whitespace-pre-wrap'>{log.data?.error}</pre>
                  ) : (
                    <pre className='whitespace-pre-wrap'>
                      {JSON.stringify(log.data?.output, null, 2)}
                    </pre>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='h-[90vh] flex flex-col p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold'>Execution History</h2>
          <div className='flex items-center gap-2'>
            {isConnected ? (
              <Badge
                variant='outline'
                className='text-green-600 border-green-600'
              >
                <Wifi className='h-3 w-3 mr-1' />
                Live
              </Badge>
            ) : (
              <Badge variant='outline' className='text-red-600 border-red-600'>
                <WifiOff className='h-3 w-3 mr-1' />
                Offline
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
          Clear
        </Button>
      </div>

      {/* Progress Bar for current execution */}
      {currentExecution &&
        currentExecution.status === 'running' &&
        currentExecution.progress && (
          <Card className='mb-4 border-primary/30'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                  <Circle className='h-4 w-4 text-primary animate-pulse' />
                  <span className='text-sm font-medium'>
                    Executing workflow...
                  </span>
                </div>
                <span className='text-sm text-muted-foreground'>
                  Step {currentExecution.progress.current} of{' '}
                  {currentExecution.progress.total}
                </span>
              </div>
              <div className='w-full bg-muted rounded-full h-2'>
                <div
                  className='bg-primary h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${(currentExecution.progress.current / currentExecution.progress.total) * 100}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

      {/* Execution Groups */}
      <ScrollArea className='flex-1' ref={scrollRef}>
        {executionGroups.length === 0 ? (
          <Card className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
            <Clock className='h-12 w-12 mb-4 opacity-50' />
            <p className='text-sm'>No execution history</p>
            <p className='text-xs mt-1'>
              Run your workflow to see execution logs here
            </p>
          </Card>
        ) : (
          <div className='space-y-4'>
            {executionGroups.map((group) => (
              <Card key={group.executionId}>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <CardTitle className='text-base'>Execution</CardTitle>
                      {getStatusBadge(group.status)}
                    </div>
                    <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                      <span>{formatDate(group.startTime)}</span>
                      <span>{formatTime(group.startTime)}</span>
                      {group.duration && (
                        <Badge variant='secondary'>
                          <Timer className='h-3 w-3 mr-1' />
                          {group.duration}ms total
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='border-l-0'>
                    {group.logs.map((log, index) =>
                      renderLogEntry(log, index, group.executionId)
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default WorkflowExecutionTab
