export const NODE_ACTION_ID = {
  // Gmail actions
  GMAIL: {
    SEND_EMAIL: 'send_email',
    READ_EMAIL: 'read_email'
  },

  // Google Drive actions
  'GOOGLE-DRIVE': {
    CREATE_FOLDER: 'create_folder',
    CREATE_FILE: 'create_file',
    DELETE_FOLDER: 'delete_folder',
    LIST_FILES: 'list_files',
    DELETE_FILE: 'delete_file',
    GET_FILE_CONTENT: 'get_file_content'
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

type Values<T> = T[keyof T]

type NestedValues<T> = Values<{
  [K in keyof T]: Values<T[K]>
}>

const UNKNOWN_ACTION = 'unknown' as const

export type TActionID =
  | NestedValues<typeof NODE_ACTION_ID>
  | typeof UNKNOWN_ACTION // idk don't ask me
