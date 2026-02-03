import { TRIGGER_ACTION_ID } from '@shared/constants'
import { TNodeExecutionResult, TWorkflowNode } from '../types/workflow.types'

/**
 * Execute a trigger node.
 * Trigger nodes are entry points for workflows - they may contain filtering/validation logic.
 * For manual triggers, we just pass through.
 * For webhook triggers (Gmail, Discord), we validate the incoming event against the trigger config.
 */
export const executeTriggerNode = async (
  node: TWorkflowNode,
  config: any,
  triggerEventData?: Record<string, any>
): Promise<TNodeExecutionResult> => {
  const { actionId } = node.data

  switch (actionId) {
    case TRIGGER_ACTION_ID.MANUAL_TRIGGER:
      // Manual trigger has no logic - just pass through
      return {
        success: true,
        data: { triggered: true, type: 'manual' }
      }

    case TRIGGER_ACTION_ID.GMAIL_WEBHOOK_TRIGGER:
      // Gmail webhook trigger - validate incoming email matches filter criteria
      return executeGmailTrigger(config, triggerEventData)

    case TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER:
      // Discord webhook trigger - validate message matches filter criteria
      return executeDiscordTrigger(config, triggerEventData)

    case TRIGGER_ACTION_ID.SCHEDULE_TRIGGER:
      // Schedule trigger - no validation, just pass through
      return executeScheduleTrigger(config, triggerEventData)

    default:
      // Unknown trigger, allow through
      return {
        success: true,
        data: { triggered: true, type: 'unknown' }
      }
  }
}

/**
 * Check if a node is a trigger node.
 */
export const isTriggerNode = (actionId: string): boolean => {
  return Object.values(TRIGGER_ACTION_ID).includes(actionId as any)
}

/**
 * Check if a trigger is a manual trigger.
 */
export const isManualTrigger = (actionId: string): boolean => {
  return actionId === TRIGGER_ACTION_ID.MANUAL_TRIGGER
}

/**
 * Check if a trigger is a scheduled trigger.
 */
export const isScheduledTrigger = (actionId: string): boolean => {
  return actionId === TRIGGER_ACTION_ID.SCHEDULE_TRIGGER
}

/**
 * Execute Gmail webhook trigger - validate incoming email matches filter criteria.
 */
const executeGmailTrigger = (
  config: any,
  eventData?: Record<string, any>
): TNodeExecutionResult => {
  // If no event data (manual test), just pass through
  if (!eventData) {
    return {
      success: true,
      data: { triggered: true, type: 'gmail_webhook', testMode: true }
    }
  }

  // Validate event data against config filters
  // For now, we just pass through - filtering can be added later
  return {
    success: true,
    data: {
      triggered: true,
      type: 'gmail_webhook',
      email: eventData
    }
  }
}

/**
 * Execute Discord webhook trigger - validate message matches filter criteria.
 */
const executeDiscordTrigger = (
  config: any,
  eventData?: Record<string, any>
): TNodeExecutionResult => {
  // If no event data (manual test), just pass through
  if (!eventData) {
    return {
      success: true,
      data: { triggered: true, type: 'discord_webhook', testMode: true }
    }
  }

  // Validate event data against config filters
  const { guildId, channelId, userId } = config || {}

  // Check guild filter
  if (guildId && eventData.guildId !== guildId) {
    return {
      success: false,
      error: `Message not from configured guild (expected: ${guildId})`
    }
  }

  // Check channel filter
  if (channelId && eventData.channelId !== channelId) {
    return {
      success: false,
      error: `Message not from configured channel (expected: ${channelId})`
    }
  }

  // Check user filter (optional)
  if (userId && eventData.authorId !== userId) {
    return {
      success: false,
      error: `Message not from configured user (expected: ${userId})`
    }
  }

  // All filters passed
  return {
    success: true,
    data: {
      triggered: true,
      type: 'discord_webhook',
      message: eventData
    }
  }
}

/**
 * Execute Schedule trigger - provides schedule metadata.
 */
const executeScheduleTrigger = (
  config: any,
  eventData?: Record<string, any>
): TNodeExecutionResult => {
  return {
    success: true,
    data: {
      triggered: true,
      type: 'schedule',
      schedule: config || {},
      event: eventData || null
    }
  }
}
