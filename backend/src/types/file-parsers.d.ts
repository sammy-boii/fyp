declare module 'xlsx' {
  interface WorkBook {
    SheetNames: string[]
    Sheets: { [sheet: string]: WorkSheet }
  }

  interface WorkSheet {
    [cell: string]: CellObject | any
  }

  interface CellObject {
    v: any
    t: string
    w?: string
  }

  interface ReadOptions {
    type?: 'buffer' | 'base64' | 'binary' | 'file' | 'array' | 'string'
    cellDates?: boolean
    cellFormula?: boolean
    cellHTML?: boolean
    cellNF?: boolean
    cellStyles?: boolean
    cellText?: boolean
    codepage?: number
    dateNF?: string
    password?: string
    sheetRows?: number
    sheetStubs?: boolean
    sheets?: number | string | string[]
    WTF?: boolean
  }

  export function read(data: any, opts?: ReadOptions): WorkBook
  export function readFile(filename: string, opts?: ReadOptions): WorkBook
  export const utils: {
    sheet_to_json<T = any>(
      worksheet: WorkSheet,
      opts?: {
        header?: 'A' | number | string[]
        dateNF?: string
        defval?: any
        blankrows?: boolean
        skipHidden?: boolean
        range?: any
        raw?: boolean
        rawNumbers?: boolean
      }
    ): T[]
    sheet_to_csv(worksheet: WorkSheet, opts?: any): string
    decode_range(range: string): {
      s: { c: number; r: number }
      e: { c: number; r: number }
    }
  }
}

declare module 'mammoth' {
  interface ExtractResult {
    value: string
    messages: any[]
  }

  interface Options {
    buffer?: Buffer
    path?: string
    arrayBuffer?: ArrayBuffer
  }

  export function extractRawText(options: Options): Promise<ExtractResult>
  export function convertToHtml(options: Options): Promise<ExtractResult>
}

declare module 'csv-parse/sync' {
  interface Options {
    columns?: boolean | string[] | ((header: string[]) => string[])
    delimiter?: string
    skip_empty_lines?: boolean
    trim?: boolean
    cast?: boolean
    from_line?: number
    to_line?: number
    relax_column_count?: boolean
  }

  export function parse<T = any>(input: string, options?: Options): T[]
}
