import { TNodeExecutionResult } from '../types/workflow.types'
import { replacePlaceholdersInConfig } from '../lib/placeholder'

// Condition operators matching frontend schema
const CONDITION_OPERATORS = {
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

type ConditionOperator = (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS]

interface Condition {
  field: string
  operator: ConditionOperator
  value?: string
}

interface ConditionConfig {
  matchType: 'all' | 'any'
  conditions: Condition[]
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: Condition): boolean {
  const { field, operator, value } = condition

  // Convert field to string for comparison
  const fieldValue = field?.toString() ?? ''
  const compareValue = value?.toString() ?? ''

  switch (operator) {
    case CONDITION_OPERATORS.EQUALS:
      return fieldValue === compareValue

    case CONDITION_OPERATORS.NOT_EQUALS:
      return fieldValue !== compareValue

    case CONDITION_OPERATORS.CONTAINS:
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase())

    case CONDITION_OPERATORS.NOT_CONTAINS:
      return !fieldValue.toLowerCase().includes(compareValue.toLowerCase())

    case CONDITION_OPERATORS.STARTS_WITH:
      return fieldValue.toLowerCase().startsWith(compareValue.toLowerCase())

    case CONDITION_OPERATORS.ENDS_WITH:
      return fieldValue.toLowerCase().endsWith(compareValue.toLowerCase())

    case CONDITION_OPERATORS.GREATER_THAN: {
      const numField = parseFloat(fieldValue)
      const numCompare = parseFloat(compareValue)
      if (isNaN(numField) || isNaN(numCompare)) return false
      return numField > numCompare
    }

    case CONDITION_OPERATORS.LESS_THAN: {
      const numField = parseFloat(fieldValue)
      const numCompare = parseFloat(compareValue)
      if (isNaN(numField) || isNaN(numCompare)) return false
      return numField < numCompare
    }

    case CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL: {
      const numField = parseFloat(fieldValue)
      const numCompare = parseFloat(compareValue)
      if (isNaN(numField) || isNaN(numCompare)) return false
      return numField >= numCompare
    }

    case CONDITION_OPERATORS.LESS_THAN_OR_EQUAL: {
      const numField = parseFloat(fieldValue)
      const numCompare = parseFloat(compareValue)
      if (isNaN(numField) || isNaN(numCompare)) return false
      return numField <= numCompare
    }

    case CONDITION_OPERATORS.IS_EMPTY:
      return (
        fieldValue === '' ||
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === 'null' ||
        fieldValue === 'undefined'
      )

    case CONDITION_OPERATORS.IS_NOT_EMPTY:
      return (
        fieldValue !== '' &&
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== 'null' &&
        fieldValue !== 'undefined'
      )

    default:
      return false
  }
}

/**
 * Execute condition evaluation
 * Returns the result with branchTaken indicating which path to follow
 */
export async function executeCondition(
  config: ConditionConfig,
  nodeOutputs: Map<string, Record<string, any>>
): Promise<TNodeExecutionResult> {
  try {
    const { matchType, conditions } = config

    if (!conditions || conditions.length === 0) {
      return {
        success: false,
        error: 'No conditions configured'
      }
    }

    // Resolve placeholders in conditions
    const resolvedConditions = conditions.map((condition) => ({
      ...condition,
      field: replacePlaceholdersInConfig({ value: condition.field }, nodeOutputs)
        .value as string,
      value: condition.value
        ? (replacePlaceholdersInConfig({ value: condition.value }, nodeOutputs)
            .value as string)
        : condition.value
    }))

    // Evaluate all conditions
    const results = resolvedConditions.map((condition) => ({
      condition: {
        field: condition.field,
        operator: condition.operator,
        value: condition.value
      },
      result: evaluateCondition(condition)
    }))

    // Determine overall result based on matchType
    let overallResult: boolean
    if (matchType === 'all') {
      overallResult = results.every((r) => r.result)
    } else {
      overallResult = results.some((r) => r.result)
    }

    const branchTaken = overallResult ? 'true' : 'false'

    return {
      success: true,
      data: {
        result: overallResult,
        branchTaken,
        matchType,
        conditionResults: results
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to evaluate conditions'
    }
  }
}
