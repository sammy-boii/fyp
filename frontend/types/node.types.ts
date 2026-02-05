import { TActionID } from '@shared/constants'
import { NODE_TYPES, TRIGGER_NODE_TYPES, ALL_NODE_TYPES } from '@/constants'
import type { Node } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import type { StaticImageData } from 'next/image'
import { type ZodObject } from 'zod'
import { ValueOf } from './index.types'

// shared node types

export interface NodeAction {
  id: string
  label: string
  fields?: any[]
  description?: string
  icon: LucideIcon
  requiresCredential?: boolean
  configForm: React.ReactNode
  configFormSchema: ZodObject<any>
}

export type NodeSubtitleContext = {
  actionId?: TActionID
  config?: any
  type?: ValueOf<typeof ALL_NODE_TYPES>
}

// the key for NodeDefinition must be a key of NODE_TYPES

export type NodeDefinition = {
  [key in keyof typeof NODE_TYPES]: SingleNodeDefinition
}

export type SingleNodeDefinition = {
  label: string
  description: string
  actions: NodeAction[]
  icon?: StaticImageData
  iconComponent?: LucideIcon
  getSubtitle?: (context: NodeSubtitleContext) => string | null
}

// Trigger node definitions
export type TriggerNodeDefinition = {
  [key in keyof typeof TRIGGER_NODE_TYPES]: SingleTriggerNodeDefinition
}

export type SingleTriggerNodeDefinition = {
  label: string
  description: string
  actions: NodeAction[]
  icon?: StaticImageData
  iconComponent?: LucideIcon
  isTrigger: true
}

// Condition node definition (uses Lucide icon)
export type ConditionNodeDefinition = {
  label: string
  description: string
  actions: NodeAction[]
  iconComponent: LucideIcon
}

export type BaseNodeProps = Node<{
  type: ValueOf<typeof ALL_NODE_TYPES>
  actionId: TActionID
  config?: any
  lastOutput?: Record<string, any>
  lastExecutedAt?: string
  isExecuting?: boolean
}>

// custom node types for react flow
import { BaseNodeMemo } from '@/components/editor/node/BaseNode'
import { TriggerNodeMemo } from '@/components/editor/node/TriggerNode'
import { ConditionNodeMemo } from '@/components/editor/custom-nodes/condition/ConditionNode'

export const nodeTypes = {
  custom_node: BaseNodeMemo,
  trigger_node: TriggerNodeMemo,
  condition_node: ConditionNodeMemo,
  // Legacy node types mapped to BaseNode for backward compatibility
  ai_node: BaseNodeMemo,
  http_node: BaseNodeMemo
}

// custom edge types for react flow
import { CurvyEdge } from '@/components/editor/edge/CurvyEdge'

export const edgeTypes = {
  curvy: CurvyEdge
}
