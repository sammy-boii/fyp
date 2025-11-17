export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE'
} as const

// used as a key type for NODE_DEFINITION but for a value to be used as a key, it must be a literal. But we're dynamically allocating it and not using a literal value so const is needed to trick the transpiler.
