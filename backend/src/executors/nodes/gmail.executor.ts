import type {
  WorkflowNode,
  ExecutionContext,
  NodeExecutionResult
} from '../../types/workflow.types'
import type { NodeExecutor } from '../../types/workflow.types'
import { AppError } from '../../types'
import { getGmailCredential } from '../../lib/credentials'

export class GmailExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const actionId = node.data.actionId

    if (!actionId) {
      return {
        success: false,
        error: 'Gmail node missing actionId'
      }
    }

    // Get user's Gmail credential
    const credential = await getGmailCredential(context.userId)
    if (!credential) {
      return {
        success: false,
        error: 'Gmail credential not found. Please connect your Gmail account.'
      }
    }

    // Get access token (refresh if needed)
    const accessToken = await this.getValidAccessToken(credential)

    // Route to specific action handler
    switch (actionId) {
      case 'send_email':
        return await this.sendEmail(node, context, accessToken)
      case 'read_email':
        return await this.readEmails(node, context, accessToken)
      default:
        return {
          success: false,
          error: `Unknown Gmail action: ${actionId}`
        }
    }
  }

  private async getValidAccessToken(credential: any): Promise<string> {
    // TODO: Implement token refresh logic if expired
    // For now, just return the access token
    return credential.accessToken
  }

  private async sendEmail(
    node: WorkflowNode,
    context: ExecutionContext,
    accessToken: string
  ): Promise<NodeExecutionResult> {
    const config = node.data.config || {}
    const inputData = context.nodeData.get(node.id) || {}

    // Merge config with input data (input data takes precedence)
    const to = inputData.to || config.to
    const subject = inputData.subject || config.subject
    const body = inputData.body || config.body

    if (!to || !subject) {
      return {
        success: false,
        error: 'Missing required fields: to, subject'
      }
    }

    try {
      // TODO: Implement actual Gmail API call
      // For now, return a mock response
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: this.createRawEmail(to, subject, body)
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || 'Failed to send email'
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: {
          messageId: result.id,
          threadId: result.threadId,
          to,
          subject
        }
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  private async readEmails(
    node: WorkflowNode,
    context: ExecutionContext,
    accessToken: string
  ): Promise<NodeExecutionResult> {
    const config = node.data.config || {}
    const maxResults = config.maxResults || 10
    const query = config.query || ''

    try {
      // Build Gmail API URL
      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`
      if (query) {
        url += `&q=${encodeURIComponent(query)}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || 'Failed to read emails'
        }
      }

      const result = await response.json()

      // TODO: Fetch full message details if needed
      return {
        success: true,
        data: {
          messages: result.messages || [],
          resultSizeEstimate: result.resultSizeEstimate
        }
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to read emails'
      }
    }
  }

  private createRawEmail(to: string, subject: string, body: string): string {
    // Create a simple raw email format
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n')

    // Base64 encode
    return Buffer.from(email).toString('base64url')
  }
}

