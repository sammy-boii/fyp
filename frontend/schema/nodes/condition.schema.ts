import { z } from 'zod'

export const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty'
} as const

export type ConditionOperator =
  (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS]

export const OPERATOR_LABELS: Record<
  ConditionOperator,
  { full: string; abbr: string }
> = {
  [CONDITION_OPERATORS.EQUALS]: { full: 'Equals', abbr: '=' },
  [CONDITION_OPERATORS.NOT_EQUALS]: { full: 'Not Equals', abbr: '≠' },
  [CONDITION_OPERATORS.CONTAINS]: { full: 'Contains', abbr: '⊃' },
  [CONDITION_OPERATORS.NOT_CONTAINS]: { full: 'Not Contains', abbr: '⊅' },
  [CONDITION_OPERATORS.STARTS_WITH]: { full: 'Starts With', abbr: 'A..' },
  [CONDITION_OPERATORS.ENDS_WITH]: { full: 'Ends With', abbr: '..Z' },
  [CONDITION_OPERATORS.GREATER_THAN]: { full: 'Greater Than', abbr: '>' },
  [CONDITION_OPERATORS.LESS_THAN]: { full: 'Less Than', abbr: '<' },
  [CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL]: {
    full: 'Greater Than or Equal',
    abbr: '≥'
  },
  [CONDITION_OPERATORS.LESS_THAN_OR_EQUAL]: {
    full: 'Less Than or Equal',
    abbr: '≤'
  },
  [CONDITION_OPERATORS.IS_EMPTY]: { full: 'Is Empty', abbr: '∅' },
  [CONDITION_OPERATORS.IS_NOT_EMPTY]: { full: 'Is Not Empty', abbr: '∃' }
}

export const conditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum([
    CONDITION_OPERATORS.EQUALS,
    CONDITION_OPERATORS.NOT_EQUALS,
    CONDITION_OPERATORS.CONTAINS,
    CONDITION_OPERATORS.NOT_CONTAINS,
    CONDITION_OPERATORS.STARTS_WITH,
    CONDITION_OPERATORS.ENDS_WITH,
    CONDITION_OPERATORS.GREATER_THAN,
    CONDITION_OPERATORS.LESS_THAN,
    CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL,
    CONDITION_OPERATORS.LESS_THAN_OR_EQUAL,
    CONDITION_OPERATORS.IS_EMPTY,
    CONDITION_OPERATORS.IS_NOT_EMPTY
  ]),
  value: z.string().optional()
})

export const conditionFormSchema = z.object({
  matchType: z.enum(['all', 'any']).default('all'),
  conditions: z
    .array(conditionSchema)
    .min(1, 'At least one condition is required')
})

export type Condition = z.infer<typeof conditionSchema>
export type ConditionFormData = z.infer<typeof conditionFormSchema>
