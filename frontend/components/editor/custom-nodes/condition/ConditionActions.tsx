'use client'

import { NodeAction } from '@/types/node.types'
import { GitBranch } from 'lucide-react'
import { ConditionForm } from './forms/ConditionForm'
import { conditionFormSchema } from '@/schema/nodes/condition.schema'

export const CONDITION_NODE_ACTION_ID = {
  EVALUATE_CONDITION: 'evaluate_condition'
} as const

export const CONDITION_ACTIONS: NodeAction[] = [
  {
    id: CONDITION_NODE_ACTION_ID.EVALUATE_CONDITION,
    label: 'Evaluate Condition',
    description: 'Evaluate conditions and route to different paths',
    icon: GitBranch,
    requiresCredential: false,
    configForm: <ConditionForm />,
    configFormSchema: conditionFormSchema
  }
]
