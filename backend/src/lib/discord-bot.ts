import { Client, GatewayIntentBits, Events } from 'discord.js'
import { triggerCache } from './trigger-cache'
import { executeWorkflowById } from './workflow-executor'

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// Track if bot is ready
let isReady = false
let isConnecting = false

const DEFAULT_LOGIN_TIMEOUT_MS = 30_000

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return String(error)
}

const getLoginTimeoutMs = (): number => {
  const parsed = Number(process.env.DISCORD_LOGIN_TIMEOUT_MS)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return DEFAULT_LOGIN_TIMEOUT_MS
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(timeoutMessage))
        }, timeoutMs)
      })
    ])
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}

// Listen for when the bot is ready
client.once(Events.ClientReady, (readyClient) => {
  isReady = true
  isConnecting = false

  console.log(`[discord] bot ready as ${readyClient.user.tag}`)
  console.log(
    `[discord] joined guild count: ${readyClient.guilds.cache.size} server(s)`
  )

  console.log(`🤖 Discord bot logged in as ${readyClient.user.tag}`)
  console.log(`📡 Bot is in ${readyClient.guilds.cache.size} server(s)`)
})

client.on(Events.Warn, (warning) => {
  console.warn(`[discord] warning: ${warning}`)
})

client.on(Events.Error, (error) => {
  console.error(`[discord] client error: ${toErrorMessage(error)}`)
})

client.on(Events.ShardDisconnect, (event, shardId) => {
  console.warn(
    `[discord] shard ${shardId} disconnected (code=${event.code}, reason=${event.reason || 'unknown'})`
  )
})

client.on(Events.ShardReconnecting, (shardId) => {
  console.warn(`[discord] shard ${shardId} reconnecting`)
})

client.on(Events.ShardResume, (shardId, replayedEvents) => {
  console.log(
    `[discord] shard ${shardId} resumed (replayedEvents=${replayedEvents})`
  )
})

client.on(Events.ShardError, (error, shardId) => {
  console.error(
    `[discord] shard ${shardId} error: ${toErrorMessage(error)}`
  )
})

// Listen for new messages
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots (including this bot)
  if (message.author.bot) return

  // Ignore DMs
  if (!message.guild) return

  const guildId = message.guild.id
  const channelId = message.channel.id
  const authorId = message.author.id

  console.log('🔍 Cache stats:', triggerCache.getStats())
  console.log(
    `📍 Looking for triggers: guildId=${guildId}, channelId=${channelId}`
  )

  // Look up matching triggers from cache
  const matchingTriggers = triggerCache.getTriggersForMessage(
    guildId,
    channelId,
    authorId
  )

  console.log(
    '🎯 Matching triggers:',
    matchingTriggers.map((t) => t.workflowId)
  )

  // Check for duplicates
  const uniqueWorkflowIds = new Set(matchingTriggers.map((t) => t.workflowId))
  if (uniqueWorkflowIds.size !== matchingTriggers.length) {
    console.warn('⚠️ DUPLICATE TRIGGERS DETECTED!')
  }

  if (matchingTriggers.length === 0) {
    return // No workflows to trigger
  }

  console.log(
    `📩 Discord message matched ${matchingTriggers.length} workflow(s)`
  )

  // Build trigger data to pass to workflows
  const triggerData = {
    guildId,
    guildName: message.guild.name,
    channelId,
    channelName: (message.channel as any).name || 'unknown',
    authorId,
    authorUsername: message.author.username,
    authorTag: message.author.tag,
    content: message.content,
    messageId: message.id,
    timestamp: message.createdAt.toISOString(),
    attachments: message.attachments.map((a) => ({
      name: a.name,
      url: a.url,
      contentType: a.contentType
    }))
  }

  // Execute each matching workflow
  for (const trigger of matchingTriggers) {
    console.log(`🚀 Executing workflow ${trigger.workflowId}...`)

    try {
      const result = await executeWorkflowById(trigger.workflowId, triggerData)

      if (result.success) {
        console.log(
          `✅ Workflow ${trigger.workflowId} executed successfully (execution: ${result.executionId})`
        )
      } else {
        console.error(
          `❌ Workflow ${trigger.workflowId} failed: ${result.error}`
        )
      }
    } catch (error) {
      console.error(`❌ Error executing workflow ${trigger.workflowId}:`, error)
    }
  }
})

// Initialize the Discord bot
export async function initDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN

  if (!token) {
    console.warn(
      '⚠️ DISCORD_BOT_TOKEN not found in environment variables. Discord bot will not start.'
    )
    return
  }

  if (isReady) {
    console.log('[discord] init requested but bot is already ready')
    return
  }

  if (isConnecting) {
    console.log('[discord] init requested while login is already in progress')
    return
  }

  const timeoutMs = getLoginTimeoutMs()
  isConnecting = true

  try {
    console.log(`[discord] login attempt started (timeout=${timeoutMs}ms)`)
    console.log('CONNECTING...')
    console.log('🔌 Discord bot connection initiated...')

    await withTimeout(
      client.login(token),
      timeoutMs,
      `Discord login timed out after ${timeoutMs}ms`
    )

    console.log('[discord] login() promise resolved')
  } catch (error) {
    isConnecting = false
    console.error(
      `[discord] failed to initialize bot: ${toErrorMessage(error)}`
    )
    console.error('❌ Failed to initialize Discord bot:', error)
  } finally {
    if (!isReady) {
      isConnecting = false
    }
  }
}

export async function shutdownDiscordBot(): Promise<void> {
  if (!isReady && !isConnecting) {
    console.log('[discord] shutdown requested but bot is already stopped')
    return
  }

  try {
    console.log('[discord] destroying Discord client...')
    client.destroy()
    console.log('[discord] Discord client destroyed')
  } catch (error) {
    console.error(
      `[discord] error while destroying Discord client: ${toErrorMessage(error)}`
    )
  } finally {
    isReady = false
    isConnecting = false
  }
}

// Export client for potential future use
export { client, isReady }
