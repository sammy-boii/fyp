export type ValueOf<T> = T[keyof T]
import { TActionID } from '@shared/constants'
import { ReactNode } from 'react'

// Node execution result from the API
export type NodeExecutionResult = {
  success: boolean
  message: string
  node: {
    id: string
    type: string
    actionId: TActionID
    duration: number
  }
  output?: Record<string, any>
  error?: string
}

export type TimelineSize = 'sm' | 'md' | 'lg'
export type TimelineStatus = 'completed' | 'in-progress' | 'pending'
export type TimelineColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'orange'
  | 'green'

export interface TimelineElement {
  id: number
  date: string
  title: string
  description: string
  icon?: ReactNode | (() => ReactNode)
  status?: TimelineStatus
  color?: TimelineColor
  size?: TimelineSize
  loading?: boolean
  error?: string
  /** Expandable content for output/error details */
  expandableContent?: {
    type: 'output' | 'error'
    content: string
  }
}

export interface TimelineProps {
  items: TimelineElement[]
  size?: TimelineSize
  animate?: boolean
  iconColor?: TimelineColor
  connectorColor?: TimelineColor
  className?: string
}
