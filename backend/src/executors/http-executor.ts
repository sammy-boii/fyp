import { TNodeExecutionResult } from '../types/workflow.types'
import { replacePlaceholdersInConfig } from '../lib/placeholder'

interface Header {
  key: string
  value: string
}

interface QueryParam {
  key: string
  value: string
}

interface HTTPConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Header[]
  queryParams?: QueryParam[]
  contentType?: string
  body?: string
}

/**
 * Execute HTTP request
 */
export async function executeHTTPRequest(
  config: HTTPConfig,
  nodeOutputs: Map<string, Record<string, any>>
): Promise<TNodeExecutionResult> {
  try {
    // Resolve placeholders in all config fields
    const resolvedConfig = replacePlaceholdersInConfig(
      config,
      nodeOutputs
    ) as HTTPConfig

    const {
      method = 'GET',
      url,
      headers = [],
      queryParams = [],
      contentType = 'application/json',
      body = ''
    } = resolvedConfig

    if (!url || url.trim() === '') {
      return {
        success: false,
        error: 'URL is required'
      }
    }

    // Build URL with query parameters
    let finalUrl = url
    if (queryParams.length > 0) {
      const urlObj = new URL(url)
      queryParams.forEach((param) => {
        if (param.key && param.key.trim() !== '') {
          urlObj.searchParams.append(param.key, param.value || '')
        }
      })
      finalUrl = urlObj.toString()
    }

    // Build headers object
    const headersObj: Record<string, string> = {}
    headers.forEach((header) => {
      if (header.key && header.key.trim() !== '') {
        headersObj[header.key] = header.value || ''
      }
    })

    // Set content-type for requests with body
    if (method !== 'GET' && body && body.trim() !== '') {
      headersObj['Content-Type'] = contentType
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: headersObj
    }

    // Add body for non-GET requests
    if (method !== 'GET' && body && body.trim() !== '') {
      fetchOptions.body = body
    }

    // Make the request
    const startTime = Date.now()
    const response = await fetch(finalUrl, fetchOptions)
    const duration = Date.now() - startTime

    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Try to parse response body
    let responseBody: any
    let responseText = ''
    const contentTypeHeader = response.headers.get('content-type') || ''

    try {
      responseText = await response.text()

      // Try to parse as JSON if content-type suggests it
      if (
        contentTypeHeader.includes('application/json') ||
        responseText.startsWith('{') ||
        responseText.startsWith('[')
      ) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = responseText
        }
      } else {
        responseBody = responseText
      }
    } catch (e) {
      responseBody = null
    }

    // Build output
    const output = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: responseHeaders,
      body: responseBody,
      url: response.url,
      duration: duration,
      request: {
        method,
        url: finalUrl,
        headers: headersObj,
        body: method !== 'GET' ? body : undefined
      }
    }

    return {
      success: true,
      data: output
    }
  } catch (error) {
    console.error('[HTTP Request] Error:', error)

    // Handle common errors
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return {
        success: false,
        error: `Invalid URL: ${config.url}`
      }
    }

    if (error instanceof Error) {
      // Network errors
      if (
        error.message.includes('ENOTFOUND') ||
        error.message.includes('getaddrinfo')
      ) {
        return {
          success: false,
          error: `Could not resolve hostname. Check if the URL is correct.`
        }
      }

      if (error.message.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: `Connection refused. The server may be down or not accepting connections.`
        }
      }

      if (
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('timeout')
      ) {
        return {
          success: false,
          error: `Request timed out. The server took too long to respond.`
        }
      }

      return {
        success: false,
        error: `HTTP request failed: ${error.message}`
      }
    }

    return {
      success: false,
      error: 'HTTP request failed with an unknown error'
    }
  }
}
