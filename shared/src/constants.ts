export const NODE_ACTION_ID = {
  // Gmail actions
  SEND_EMAIL: 'send_email',
  READ_EMAIL: 'read_email',

  // Google Drive actions
  CREATE_FOLDER: 'create_folder',
  CREATE_FILE: 'create_file',
  DELETE_FOLDER: 'delete_folder',
  LIST_FILES: 'list_files',
  DELETE_FILE: 'delete_file',
  GET_FILE_CONTENT: 'get_file_content',

  // Discord actions
  DISCORD_SEND_CHANNEL_MESSAGE: 'discord_send_channel_message',
  DISCORD_SEND_DM: 'discord_send_dm',
  DISCORD_LIST_GUILDS: 'discord_list_guilds',
  DISCORD_LIST_CHANNELS: 'discord_list_channels',
  DISCORD_CREATE_CHANNEL: 'discord_create_channel'
} as const
