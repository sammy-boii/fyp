import { BaseNode } from '@/components/editor/node/BaseNode'
import { NODE_TYPES } from '@/constants'
import type { Node } from '@xyflow/react'
import { LucideIcon } from 'lucide-react'
import type { StaticImageData } from 'next/image'

// shared node types

export interface NodeAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  configForm: React.ReactNode
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
  type: (typeof NODE_TYPES)[keyof typeof NODE_TYPES]
}>

// custom node types for react flow

export const nodeTypes = {
  custom_node: BaseNode
}
