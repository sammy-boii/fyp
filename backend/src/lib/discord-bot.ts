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

// Listen for when the bot is ready
client.once(Events.ClientReady, (readyClient) => {
  isReady = true
  console.log(`🤖 Discord bot logged in as ${readyClient.user.tag}`)
  console.log(`📡 Bot is in ${readyClient.guilds.cache.size} server(s)`)
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

  console.log("🔍 Cache stats:", triggerCache.getStats())
  console.log(`📍 Looking for triggers: guildId=${guildId}, channelId=${channelId}`)
  
  // Look up matching triggers from cache
  const matchingTriggers = triggerCache.getTriggersForMessage(
    guildId,
    channelId,
    authorId
  )
  
  console.log("🎯 Matching triggers:", matchingTriggers.map(t => t.workflowId))
  
  // Check for duplicates
  const uniqueWorkflowIds = new Set(matchingTriggers.map(t => t.workflowId))
  if (uniqueWorkflowIds.size !== matchingTriggers.length) {
    console.warn("⚠️ DUPLICATE TRIGGERS DETECTED!")
  }

  if (matchingTriggers.length === 0) {
    return // No workflows to trigger
  }

  console.log(`📩 Discord message matched ${matchingTriggers.length} workflow(s)`)

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
        console.log(`✅ Workflow ${trigger.workflowId} executed successfully (execution: ${result.executionId})`)
      } else {
        console.error(`❌ Workflow ${trigger.workflowId} failed: ${result.error}`)
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
    console.warn('⚠️ DISCORD_BOT_TOKEN not found in environment variables. Discord bot will not start.')
    return
  }

  try {
    await client.login(token)
    console.log('🔌 Discord bot connection initiated...')
  } catch (error) {
    console.error('❌ Failed to initialize Discord bot:', error)
  }
}

// Export client for potential future use
export { client, isReady }
