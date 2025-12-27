import type {
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult
} from '../../types/workflow.types'
import type { NodeExecutor } from '../../types/workflow.types'
import { getGoogleDriveCredential } from '../../lib/credentials'

export class GoogleDriveExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const actionId = node.data.actionId

    if (!actionId) {
      return {
        success: false,
        error: 'Google Drive node missing actionId'
      }
    }

    // Get user's Google Drive credential
    const credential = await getGoogleDriveCredential(context.userId)
    if (!credential) {
      return {
        success: false,
        error:
          'Google Drive credential not found. Please connect your Google Drive account.'
      }
    }

    // Get access token (refresh if needed)
    const accessToken = await this.getValidAccessToken(credential)

    // Route to specific action handler
    switch (actionId) {
      case 'upload_file':
        return await this.uploadFile(node, context, accessToken)
      case 'list_files':
        return await this.listFiles(node, context, accessToken)
      case 'download_file':
        return await this.downloadFile(node, context, accessToken)
      default:
        return {
          success: false,
          error: `Unknown Google Drive action: ${actionId}`
        }
    }
  }

  private async getValidAccessToken(credential: any): Promise<string> {
    // TODO: Implement token refresh logic if expired
    return credential.accessToken
  }

  private async uploadFile(
    node: WorkflowNode,
    context: ExecutionContext,
    accessToken: string
  ): Promise<NodeExecutionResult> {
    const config = node.data.config || {}
    const inputData = context.nodeData.get(node.id) || {}

    // TODO: Implement file upload logic
    return {
      success: false,
      error: 'Upload file action not yet implemented'
    }
  }

  private async listFiles(
    node: WorkflowNode,
    context: ExecutionContext,
    accessToken: string
  ): Promise<NodeExecutionResult> {
    const config = node.data.config || {}
    const query = config.query || "mimeType != 'application/vnd.google-apps.folder'"

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || 'Failed to list files'
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: {
          files: result.files || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to list files'
      }
    }
  }

  private async downloadFile(
    node: WorkflowNode,
    context: ExecutionContext,
    accessToken: string
  ): Promise<NodeExecutionResult> {
    // TODO: Implement file download logic
    return {
      success: false,
      error: 'Download file action not yet implemented'
    }
  }
}

