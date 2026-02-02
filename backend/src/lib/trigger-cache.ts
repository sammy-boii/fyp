import { prisma } from '@shared/db/prisma'
import { TRIGGER_ACTION_ID } from '@shared/constants'

/**
 * Cached trigger info for fast lookup
 */
export interface CachedTrigger {
  workflowId: string
  credentialId: string
  guildId: string
  channelId: string
  userId?: string // Optional user filter
}

/**
 * In-memory cache for Discord webhook triggers.
 * Structure: Map<guildId, Map<channelId, CachedTrigger[]>>
 * Provides O(1) lookup for matching triggers on incoming Discord messages.
 */
class TriggerCacheService {
  // guildId -> channelId -> triggers
  private cache: Map<string, Map<string, CachedTrigger[]>> = new Map()

  // workflowId -> guildId for quick removal
  private workflowIndex: Map<string, string> = new Map()

  private isLoaded = false

  /**
   * Load all active Discord webhook triggers from the database.
   * Called once on server startup.
   */
  async loadAllActiveDiscordTriggers(): Promise<void> {
    console.log('🔄 Loading active Discord triggers into cache...')

    const workflows = await prisma.workflow.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        nodes: true
      }
    })

    let triggerCount = 0

    for (const workflow of workflows) {
      const nodes = workflow.nodes as any[]
      const discordTrigger = nodes.find(
        (node) =>
          node.data?.actionId === TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER
      )

      if (discordTrigger && discordTrigger.data?.config) {
        const { credentialId, guildId, channelId, userId } =
          discordTrigger.data.config

        if (credentialId && guildId && channelId) {
          this.addToCache({
            workflowId: workflow.id,
            credentialId,
            guildId,
            channelId,
            userId: userId || undefined
          })
          triggerCount++
        }
      }
    }

    this.isLoaded = true
    console.log(`✅ Loaded ${triggerCount} active Discord triggers into cache`)
  }

  /**
   * Get all triggers that match an incoming Discord message.
   */
  getTriggersForMessage(
    guildId: string,
    channelId: string,
    authorId?: string
  ): CachedTrigger[] {
    const guildCache = this.cache.get(guildId)
    if (!guildCache) return []

    const channelTriggers = guildCache.get(channelId) || []

    // Filter by userId if the trigger has a user filter configured
    return channelTriggers.filter((trigger) => {
      if (trigger.userId && authorId && trigger.userId !== authorId) {
        return false
      }
      return true
    })
  }

  /**
   * Refresh cache for a specific workflow.
   * Called when a workflow is activated.
   */
  async refreshWorkflow(workflowId: string): Promise<void> {
    // First remove any existing entry
    this.removeWorkflow(workflowId)

    // Fetch the workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        isActive: true,
        nodes: true
      }
    })

    if (!workflow || !workflow.isActive) {
      return
    }

    const nodes = workflow.nodes as any[]
    const discordTrigger = nodes.find(
      (node) =>
        node.data?.actionId === TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER
    )

    if (discordTrigger && discordTrigger.data?.config) {
      const { credentialId, guildId, channelId, userId } =
        discordTrigger.data.config

      if (credentialId && guildId && channelId) {
        this.addToCache({
          workflowId: workflow.id,
          credentialId,
          guildId,
          channelId,
          userId: userId || undefined
        })
        console.log(`🔄 Cached trigger for workflow ${workflowId}`)
      }
    }
  }

  /**
   * Remove a workflow from the cache.
   * Called when a workflow is deactivated.
   */
  removeWorkflow(workflowId: string): void {
    const guildId = this.workflowIndex.get(workflowId)
    if (!guildId) return

    const guildCache = this.cache.get(guildId)
    if (!guildCache) return

    // Remove from all channels in this guild
    const entries = Array.from(guildCache.entries())
    for (const [channelId, triggers] of entries) {
      const filtered = triggers.filter(
        (t: CachedTrigger) => t.workflowId !== workflowId
      )
      if (filtered.length === 0) {
        guildCache.delete(channelId)
      } else {
        guildCache.set(channelId, filtered)
      }
    }

    // Clean up empty guild cache
    if (guildCache.size === 0) {
      this.cache.delete(guildId)
    }

    this.workflowIndex.delete(workflowId)
    console.log(`🗑️ Removed trigger cache for workflow ${workflowId}`)
  }

  /**
   * Add a trigger to the cache.
   */
  private addToCache(trigger: CachedTrigger): void {
    const { guildId, channelId, workflowId } = trigger

    // Get or create guild map
    if (!this.cache.has(guildId)) {
      this.cache.set(guildId, new Map())
    }
    const guildCache = this.cache.get(guildId)!

    // Get or create channel array
    if (!guildCache.has(channelId)) {
      guildCache.set(channelId, [])
    }
    const channelTriggers = guildCache.get(channelId)!

    // Add trigger
    channelTriggers.push(trigger)

    // Index for quick removal
    this.workflowIndex.set(workflowId, guildId)
  }

  /**
   * Check if a workflow exists in the cache.
   */
  hasWorkflow(workflowId: string): boolean {
    return this.workflowIndex.has(workflowId)
  }

  /**
   * Get cache stats for debugging.
   */
  getStats(): { guilds: number; triggers: number } {
    let triggers = 0
    const guildCaches = Array.from(this.cache.values())
    for (const guildCache of guildCaches) {
      const channelTriggersArr = Array.from(guildCache.values())
      for (const channelTriggers of channelTriggersArr) {
        triggers += channelTriggers.length
      }
    }
    return { guilds: this.cache.size, triggers }
  }

  isReady(): boolean {
    return this.isLoaded
  }
}

// Singleton instance
export const triggerCache = new TriggerCacheService()

/**
 * Initialize the trigger cache. Call on server startup.
 */
export async function initTriggerCache(): Promise<void> {
  await triggerCache.loadAllActiveDiscordTriggers()
}
