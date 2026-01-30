declare module 'pdf-parse-fork' {
  interface PDFData {
    numpages: number
    numrender: number
    info: any
    metadata: any
    version: string
    text: string
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => string
    max?: number
    version?: string
  }

  function pdfParse(
    dataBuffer: Buffer | ArrayBuffer,
    options?: PDFOptions
  ): Promise<PDFData>

  export default pdfParse
}
