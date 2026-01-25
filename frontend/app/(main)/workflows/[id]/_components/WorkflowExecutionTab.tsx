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
import { TimelineLayout } from '@/components/timeline'
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
import type { TimelineElement } from '@/types/index.types'

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

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set())

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

  // Convert execution group logs to timeline items
  const convertLogsToTimeline = (
    logs: ExecutionLog[],
    execId: string
  ): TimelineElement[] => {
    return logs.map((log, index) => {
      const hasOutput =
        log.data?.output && Object.keys(log.data.output).length > 0
      const hasError = !!log.data?.error
      const nodeKey = `${execId}-${index}`
      const isExpanded = expandedOutputs.has(nodeKey)

      const getIcon = () => {
        switch (log.type) {
          case 'workflow:start':
            return <Play className='h-5 w-5' />
          case 'node:start':
            return <Circle className='h-5 w-5' />
          case 'node:complete':
            return <CheckCircle2 className='h-5 w-5' />
          case 'node:error':
            return <XCircle className='h-5 w-5' />
          case 'workflow:complete':
            return <CheckCircle2 className='h-5 w-5' />
          case 'workflow:error':
            return <XCircle className='h-5 w-5' />
          default:
            return <Circle className='h-5 w-5' />
        }
      }

      const getColor = (): TimelineElement['color'] => {
        switch (log.type) {
          case 'node:error':
          case 'workflow:error':
            return 'destructive'
          case 'node:start':
            return 'accent'
          case 'workflow:start':
            return 'secondary'
          default:
            return 'primary'
        }
      }

      const getTitle = () => {
        switch (log.type) {
          case 'workflow:start':
            return 'Workflow Started'
          case 'node:start':
            return `Executing: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`
          case 'node:complete':
            return `Completed: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`
          case 'node:error':
            return `Failed: ${formatNodeName(log.data?.nodeId, log.data?.nodeName)}`
          case 'workflow:complete':
            return 'Workflow Completed'
          case 'workflow:error':
            return 'Workflow Failed'
          default:
            return log.type
        }
      }

      // Build description with expandable output/error
      const buildDescription = () => {
        const parts: string[] = []

        if (log.data?.duration) {
          parts.push(`Duration: ${log.data.duration}ms`)
        }

        if (hasError) {
          return log.data?.error || 'An error occurred'
        }

        if (hasOutput && !isExpanded) {
          parts.push('Output available - click to expand')
        }

        return parts.join(' • ')
      }

      return {
        id: index + 1,
        date: formatTime(log.timestamp),
        title: getTitle(),
        description: buildDescription(),
        icon: getIcon(),
        color: getColor(),
        status:
          log.type.includes('complete') || log.type.includes('error')
            ? 'completed'
            : log.type.includes('start')
              ? 'in-progress'
              : ('pending' as const)
      } satisfies TimelineElement
    })
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

  // Render output/error detail section for a log
  const renderLogDetail = (
    log: ExecutionLog,
    index: number,
    execId: string
  ) => {
    const nodeKey = `${execId}-${index}`
    const hasOutput =
      log.data?.output && Object.keys(log.data.output).length > 0
    const hasError = !!log.data?.error
    const isExpandable = hasOutput || hasError
    const isExpanded = expandedOutputs.has(nodeKey)

    if (!isExpandable) return null

    return (
      <Collapsible
        key={nodeKey}
        open={isExpanded}
        onOpenChange={() => {
          setExpandedOutputs((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(nodeKey)) {
              newSet.delete(nodeKey)
            } else {
              newSet.add(nodeKey)
            }
            return newSet
          })
        }}
        className='ml-14 mt-1 mb-3'
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors',
              hasError
                ? 'text-destructive/80 hover:text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
            {hasError ? (
              <>
                <AlertCircle className='h-3 w-3' />
                View Error Details
              </>
            ) : (
              <>
                <FileOutput className='h-3 w-3' />
                View Output
              </>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={cn(
              'mt-2 p-4 rounded-lg text-xs font-mono overflow-x-auto',
              hasError ? 'bg-destructive/5 text-destructive' : 'bg-muted/50'
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
    )
  }

  return (
    <div className='h-[90vh] flex flex-col p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <h2 className='text-xl font-semibold'>Execution History</h2>
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
          <Card className='mb-6 border-primary/30 bg-primary/5'>
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
          <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
            <Clock className='h-16 w-16 mb-4 opacity-30' />
            <p className='text-base font-medium'>No execution history</p>
            <p className='text-sm mt-1'>
              Run your workflow to see execution logs here
            </p>
          </div>
        ) : (
          <div className='space-y-6 pr-4'>
            {executionGroups.map((group) => (
              <Card key={group.executionId} className='overflow-hidden'>
                <CardHeader className='pb-4 bg-muted/30'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <CardTitle className='text-base font-semibold'>
                        Workflow Execution
                      </CardTitle>
                      {getStatusBadge(group.status)}
                    </div>
                    <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                      <span className='font-medium'>
                        {formatDateTime(group.startTime)}
                      </span>
                      {group.duration && (
                        <Badge variant='secondary' className='font-mono'>
                          <Timer className='h-3 w-3 mr-1' />
                          {group.duration}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-6 pb-4'>
                  {/* Timeline with framer motion */}
                  <TimelineLayout
                    animate
                    items={convertLogsToTimeline(group.logs, group.executionId)}
                    size='md'
                    className='mx-0 max-w-none'
                  />

                  {/* Expandable output/error sections */}
                  {group.logs.map((log, index) =>
                    renderLogDetail(log, index, group.executionId)
                  )}
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
