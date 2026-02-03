export const NODE_ACTION_ID = {
  // Gmail actions
  GMAIL: {
    SEND_EMAIL: 'send_email',
    READ_EMAIL: 'read_email',
    DELETE_EMAIL: 'delete_email'
  },

  // Google Drive actions
  'GOOGLE-DRIVE': {
    CREATE_FOLDER: 'create_folder',
    CREATE_FILE: 'create_file',
    DELETE_FOLDER: 'delete_folder',
    LIST_FILES: 'list_files',
    DELETE_FILE: 'delete_file'
  },

  // Discord actions
  DISCORD: {
    SEND_CHANNEL_MESSAGE: 'send_channel_message',
    SEND_DM: 'send_dm',
    LIST_GUILDS: 'list_guilds',
    LIST_CHANNELS: 'list_channels',
    CREATE_CHANNEL: 'create_channel'
  }
} as const

export const TRIGGER_ACTION_ID = {
  MANUAL_TRIGGER: 'on_demand',
  GMAIL_WEBHOOK_TRIGGER: 'gmail_webhook',
  DISCORD_WEBHOOK_TRIGGER: 'discord_webhook',
  SCHEDULE_TRIGGER: 'schedule_trigger'
} as const

export type TTriggerActionID =
  (typeof TRIGGER_ACTION_ID)[keyof typeof TRIGGER_ACTION_ID]

type Values<T> = T[keyof T]

type NestedValues<T> = Values<{
  [K in keyof T]: Values<T[K]>
}>

const UNKNOWN_ACTION = 'unknown' as const

export type TActionID =
  | NestedValues<typeof NODE_ACTION_ID>
  | TTriggerActionID
  | typeof UNKNOWN_ACTION
