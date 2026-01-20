import { NODE_ACTION_ID } from './../../shared/src/constants'
import { BaseNode } from '@/components/editor/node/BaseNode'
import { NODE_TYPES } from '@/constants'
import type { Node } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import type { StaticImageData } from 'next/image'
import { type ZodObject } from 'zod'

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

// the key for NodeDefinition must be a key of NODE_TYPES

export type NodeDefinition = {
  [key in keyof typeof NODE_TYPES]: SingleNodeDefinition
}

export type SingleNodeDefinition = {
  label: string
  description: string
  actions: NodeAction[]
  icon: StaticImageData
}

export type BaseNodeProps = Node<{
  type: ValueOf<typeof NODE_TYPES>
  actionId: ValueOf<typeof NODE_ACTION_ID>
  config?: any
}>

// custom node types for react flow
import { BaseNodeMemo } from '@/components/editor/node/BaseNode'

export const nodeTypes = {
  custom_node: BaseNodeMemo
}

// custom edge types for react flow
import { CurvyEdge } from '@/components/editor/edge/CurvyEdge'
import { ValueOf } from './index.types'

export const edgeTypes = {
  curvy: CurvyEdge
}
