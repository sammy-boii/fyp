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
  UPLOAD_FILE: 'upload_file'
} as const
