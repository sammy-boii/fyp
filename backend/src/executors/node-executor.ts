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
import {
  executeSendChannelMessage,
  executeSendDM,
  executeListGuilds,
  executeListChannels,
  executeCreateChannel
} from './discord-executor'

export const executeNodeLogic = async (
  node: TWorkflowNode,
  config: any,
  inputData: any = null
): Promise<TNodeExecutionResult> => {
  const { actionId } = node.data

  let result: TNodeExecutionResult

  switch (actionId) {
    // Gmail actions
    case NODE_ACTION_ID.GMAIL.SEND_EMAIL:
      result = await executeSendEmail(config)
      break

    case NODE_ACTION_ID.GMAIL.READ_EMAIL:
      result = await executeReadEmail(config)
      break

    // Google Drive actions
    case NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FOLDER:
      result = await executeCreateFolder(config)
      break

    case NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FILE:
      result = await executeCreateFile(config)
      break

    case NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FOLDER:
      result = await executeDeleteFolder(config)
      break

    case NODE_ACTION_ID['GOOGLE-DRIVE'].LIST_FILES:
      result = await executeListFiles(config)
      break

    case NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FILE:
      result = await executeDeleteFile(config)
      break

    case NODE_ACTION_ID['GOOGLE-DRIVE'].GET_FILE_CONTENT:
      result = await executeGetFileContent(config)
      break

    // Discord actions
    case NODE_ACTION_ID.DISCORD.SEND_CHANNEL_MESSAGE:
      result = await executeSendChannelMessage(config)
      break

    case NODE_ACTION_ID.DISCORD.SEND_DM:
      result = await executeSendDM(config)
      break

    case NODE_ACTION_ID.DISCORD.LIST_GUILDS:
      result = await executeListGuilds(config)
      break

    case NODE_ACTION_ID.DISCORD.LIST_CHANNELS:
      result = await executeListChannels(config)
      break

    case NODE_ACTION_ID.DISCORD.CREATE_CHANNEL:
      result = await executeCreateChannel(config)
      break

    default:
      result = { success: false, error: `Unknown action: ${actionId}` }
  }

  return result
}
