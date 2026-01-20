import { NODE_ACTION_ID } from '@shared/constants'
import { TNodeExecutionResult, TWorkflowNode } from '../types/workflow.types'
import { executeReadEmail, executeSendEmail } from './gmail-executor'

export const executeNodeLogic = async (
  node: TWorkflowNode,
  config: any,
  inputData: any = null
): Promise<TNodeExecutionResult> => {
  const { actionId } = node.data

  console.log(`[executeNode] Node ${node.id} | Action: ${actionId}`)

  let result: TNodeExecutionResult

  switch (actionId) {
    case NODE_ACTION_ID.SEND_EMAIL:
      result = await executeSendEmail(config, inputData)
      break

    case NODE_ACTION_ID.READ_EMAIL:
      result = await executeReadEmail(config, inputData)
      break

    default:
      result = { success: false, error: `Unknown action: ${actionId}` }
  }

  return result
}
