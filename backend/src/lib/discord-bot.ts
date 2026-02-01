import { Client, GatewayIntentBits, Events } from 'discord.js'

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
client.on(Events.MessageCreate, (message) => {
  // Ignore messages from bots (including this bot)
  if (message.author.bot) return

  console.log('📩 New Discord message received:')
  console.log(`   Server: ${message.guild?.name || 'DM'}`)
  console.log(`   Channel: ${message.channel.isDMBased() ? 'DM' : (message.channel as any).name}`)
  console.log(`   Author: ${message.author.tag}`)
  console.log(`   Content: ${message.content}`)
  console.log(`   Timestamp: ${message.createdAt.toISOString()}`)
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
