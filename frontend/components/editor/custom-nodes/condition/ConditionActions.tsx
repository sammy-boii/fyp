'use client'

import { NodeAction } from '@/types/node.types'
import { GitBranch } from 'lucide-react'
import { ConditionForm } from './forms/ConditionForm'
import { conditionFormSchema } from '@/schema/nodes/condition.schema'
import { NODE_ACTION_ID } from '@shared/constants'

// Re-export for backwards compatibility with existing code
export const CONDITION_NODE_ACTION_ID = NODE_ACTION_ID.CONDITION

export const CONDITION_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.CONDITION.EVALUATE_CONDITION,
    label: 'Evaluate Condition',
    description: 'Evaluate conditions and route to different paths',
    icon: GitBranch,
    requiresCredential: false,
    configForm: <ConditionForm />,
    configFormSchema: conditionFormSchema
  }
]
