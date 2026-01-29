import { NODE_ACTION_ID } from '@shared/constants'
import { TNodeExecutionResult, TWorkflowNode } from '../types/workflow.types'
import { executeReadEmail, executeSendEmail } from './gmail-executor'
import {
  executeCreateFolder,
  executeCreateFile,
  executeDeleteFolder,
  executeListFiles,
  executeDeleteFile,
  executeGetFileContent
} from './google-drive-executor'

export const executeNodeLogic = async (
  node: TWorkflowNode,
  config: any,
  inputData: any = null
): Promise<TNodeExecutionResult> => {
  const { actionId } = node.data

  console.log(`[executeNode] Node ${node.id} | Action: ${actionId}`)

  let result: TNodeExecutionResult

  switch (actionId) {
    // Gmail actions
    case NODE_ACTION_ID.SEND_EMAIL:
      result = await executeSendEmail(config)
      break

    case NODE_ACTION_ID.READ_EMAIL:
      result = await executeReadEmail(config)
      break

    // Google Drive actions
    case NODE_ACTION_ID.CREATE_FOLDER:
      result = await executeCreateFolder(config)
      break

    case NODE_ACTION_ID.CREATE_FILE:
      result = await executeCreateFile(config)
      break

    case NODE_ACTION_ID.DELETE_FOLDER:
      result = await executeDeleteFolder(config)
      break

    case NODE_ACTION_ID.LIST_FILES:
      result = await executeListFiles(config)
      break

    case NODE_ACTION_ID.DELETE_FILE:
      result = await executeDeleteFile(config)
      break

    case NODE_ACTION_ID.GET_FILE_CONTENT:
      result = await executeGetFileContent(config)
      break

    default:
      result = { success: false, error: `Unknown action: ${actionId}` }
  }

  return result
}
