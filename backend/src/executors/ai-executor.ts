import { TNodeExecutionResult } from '../types/workflow.types'
import { replacePlaceholdersInConfig } from '../lib/placeholder'
import { generateWithGemini, generateWithHuggingFace } from '../lib/ai-client'

type CustomFieldEntry = {
  key: string
  value?: string
}

interface AIConfig {
  prompt: string
  systemPrompt?: string
  customFields?: CustomFieldEntry[] | Record<string, unknown>
  custom_fields?: CustomFieldEntry[] | Record<string, unknown>
}

interface AIResponse {
  answer: string
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  data: Record<string, any>
  custom_fields: Record<string, any>
  metadata: {
    question_type: string
  }
}

const BASE_SYSTEM_PROMPT = `You are a workflow automation AI node.

You must output exactly one valid JSON object and nothing else.

JSON schema to follow:
{
  "answer": "string",
  "explanation": "string",
  "confidence": "high | medium | low",
  "data": {
    "any_relevant_key": "any valid JSON value"
  },
  "custom_fields": {
    "field_name": "any valid JSON value"
  },
  "metadata": {
    "question_type": "classification | generation | extraction | analysis | other"
  }
}

Rules:
- Never output markdown, code fences, or prose before/after JSON.
- Always include all required top-level keys.
- The answer field MUST be the direct final output for the user's prompt.
- If the user asks a question, answer must directly answer that question.
- If the user asks to write/draft/reply, answer must be the full drafted text to send.
- Do not describe what you did in answer; just provide the requested result.
- Do not summarize or paraphrase unless the user explicitly asks for a summary.
- explanation must be a longer expanded version of answer with more detail.
- explanation must preserve the same meaning as answer and must not contradict it.
- Use data for rich structured information.
- Use metadata.question_type to classify the task.`

const normalizeSpace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim()

const ensureExpandedExplanation = (
  answer: string,
  explanation: string
): string => {
  const cleanAnswer = answer.trim()
  const cleanExplanation = explanation.trim()

  if (!cleanAnswer) {
    return cleanExplanation || 'No explanation provided'
  }

  if (!cleanExplanation) {
    return `${cleanAnswer}\n\nExpanded explanation: This provides a more detailed version of the same answer while preserving the same intent and meaning.`
  }

  const normalizedAnswer = normalizeSpace(cleanAnswer).toLowerCase()
  const normalizedExplanation = normalizeSpace(cleanExplanation).toLowerCase()
  const isSameText = normalizedAnswer === normalizedExplanation

  if (!isSameText && cleanExplanation.length > cleanAnswer.length) {
    return cleanExplanation
  }

  const suffixed = `${cleanExplanation} Expanded explanation: This is the same response in a more detailed form for clarity and downstream use.`

  if (suffixed.length > cleanAnswer.length) {
    return suffixed
  }

  return `${cleanExplanation}\n\nExpanded explanation detail: ${cleanAnswer}`
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toCustomFieldsObject = (
  customFields: AIConfig['customFields'] | AIConfig['custom_fields']
): Record<string, string> => {
  if (!customFields) {
    return {}
  }

  if (Array.isArray(customFields)) {
    return customFields.reduce<Record<string, string>>((acc, entry) => {
      if (!isRecord(entry)) {
        return acc
      }

      const key =
        typeof entry.key === 'string' ? entry.key.trim() : String(entry.key)

      if (!key) {
        return acc
      }

      acc[key] =
        typeof entry.value === 'string'
          ? entry.value
          : String(entry.value ?? '')

      return acc
    }, {})
  }

  if (isRecord(customFields)) {
    return Object.entries(customFields).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (!key.trim()) {
          return acc
        }

        const serializedValue = JSON.stringify(value)
        acc[key] =
          typeof value === 'string'
            ? value
            : (serializedValue ?? String(value ?? ''))
        return acc
      },
      {}
    )
  }

  return {}
}

const buildSystemPrompt = (options: {
  systemPrompt?: string
  customFields: Record<string, string>
}): string => {
  const customFieldKeys = Object.keys(options.customFields)

  const customFieldsSection =
    customFieldKeys.length > 0
      ? [
          'Custom fields requirement:',
          '- You MUST return all requested keys in custom_fields.',
          `- Required keys: ${customFieldKeys.join(', ')}`,
          ...customFieldKeys.map((key) => {
            const hint = options.customFields[key]?.trim()
            return hint
              ? `- ${key}: ${hint}`
              : `- ${key}: include the best inferred value for this key`
          }),
          '- If a key cannot be confidently inferred, set it to null.'
        ].join('\n')
      : [
          'Custom fields requirement:',
          '- Return custom_fields as an empty object {} when no fields are requested.'
        ].join('\n')

  const userSystemPrompt = options.systemPrompt?.trim()
    ? [
        'Additional instructions for this node:',
        options.systemPrompt.trim(),
        'Do not violate the required JSON schema while following these instructions.'
      ].join('\n')
    : ''

  return [BASE_SYSTEM_PROMPT, customFieldsSection, userSystemPrompt]
    .filter(Boolean)
    .join('\n\n')
}

const parseJSONFromContent = (content: string): unknown => {
  const normalized = content
    .replace(/```json\n?/gi, '')
    .replace(/\n?```/g, '')
    .trim()

  try {
    return JSON.parse(normalized)
  } catch {
    const firstBrace = normalized.indexOf('{')
    const lastBrace = normalized.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(normalized.slice(firstBrace, lastBrace + 1))
    }

    throw new Error('Invalid JSON response')
  }
}

const normalizeConfidence = (value: unknown): AIResponse['confidence'] => {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  return 'medium'
}

const normalizeAIResponse = (
  value: unknown,
  rawContent: string,
  customFieldTemplate: Record<string, string>
): AIResponse => {
  if (!isRecord(value)) {
    const fallbackCustomFields = Object.keys(customFieldTemplate).reduce<
      Record<string, any>
    >((acc, key) => {
      acc[key] = null
      return acc
    }, {})

    return {
      answer: rawContent,
      explanation: 'Raw response (JSON parsing failed)',
      confidence: 'medium',
      data: { raw: rawContent },
      custom_fields: fallbackCustomFields,
      metadata: { question_type: 'other' }
    }
  }

  const answer =
    typeof value.answer === 'string' && value.answer.trim()
      ? value.answer.trim()
      : rawContent

  const explanation =
    typeof value.explanation === 'string' && value.explanation.trim()
      ? value.explanation.trim()
      : typeof value.explaination === 'string' && value.explaination.trim()
        ? value.explaination.trim()
        : 'No explanation provided'

  const expandedExplanation = ensureExpandedExplanation(answer, explanation)

  const data = isRecord(value.data)
    ? (value.data as Record<string, any>)
    : ({} as Record<string, any>)

  const metadataRaw = isRecord(value.metadata)
    ? value.metadata
    : ({ question_type: 'other' } as Record<string, unknown>)

  const metadata = {
    question_type:
      typeof metadataRaw.question_type === 'string' &&
      metadataRaw.question_type.trim()
        ? metadataRaw.question_type.trim()
        : 'other'
  }

  const parsedCustomFields = isRecord(value.custom_fields)
    ? value.custom_fields
    : ({} as Record<string, unknown>)

  const normalizedCustomFields = Object.entries(customFieldTemplate).reduce<
    Record<string, any>
  >((acc, [key]) => {
    acc[key] = key in parsedCustomFields ? parsedCustomFields[key] : null
    return acc
  }, {})

  for (const [key, fieldValue] of Object.entries(parsedCustomFields)) {
    if (!(key in normalizedCustomFields)) {
      normalizedCustomFields[key] = fieldValue
    }
  }

  return {
    answer,
    explanation: expandedExplanation,
    confidence: normalizeConfidence(value.confidence),
    data,
    custom_fields: normalizedCustomFields,
    metadata
  }
}

/**
 * Execute AI prompt and get response
 */
export async function executeAskAI(
  config: AIConfig,
  nodeOutputs: Map<string, Record<string, any>>
): Promise<TNodeExecutionResult> {
  try {
    const { prompt } = config

    if (!prompt || prompt.trim() === '') {
      return {
        success: false,
        error: 'Prompt is required'
      }
    }

    if (!process.env.GEMINI_API_KEY && !process.env.HF_TOKEN) {
      return {
        success: false,
        error:
          'No AI provider configured. Set GEMINI_API_KEY (preferred) or HF_TOKEN.'
      }
    }

    // Resolve placeholders in all configurable prompt fields.
    const resolvedConfig = replacePlaceholdersInConfig(
      {
        prompt,
        systemPrompt: config.systemPrompt || '',
        customFields: config.customFields || config.custom_fields || []
      },
      nodeOutputs
    ) as {
      prompt: string
      systemPrompt?: string
      customFields?: CustomFieldEntry[] | Record<string, unknown>
    }

    const resolvedPrompt =
      typeof resolvedConfig.prompt === 'string' ? resolvedConfig.prompt : ''
    const resolvedSystemPrompt =
      typeof resolvedConfig.systemPrompt === 'string'
        ? resolvedConfig.systemPrompt
        : ''
    const customFieldTemplate = toCustomFieldsObject(
      resolvedConfig.customFields
    )
    const systemPrompt = buildSystemPrompt({
      systemPrompt: resolvedSystemPrompt,
      customFields: customFieldTemplate
    })

    const content = process.env.GEMINI_API_KEY
      ? await generateWithGemini({
          systemPrompt,
          userPrompt: resolvedPrompt,
          maxTokens: 1000,
          temperature: 0.4,
          responseMimeType: 'application/json'
        })
      : await generateWithHuggingFace({
          systemPrompt,
          userPrompt: resolvedPrompt,
          maxTokens: 1000,
          temperature: 0.4
        })

    let aiResponse: AIResponse

    try {
      const parsed = parseJSONFromContent(content)
      aiResponse = normalizeAIResponse(
        parsed,
        content.trim(),
        customFieldTemplate
      )
    } catch {
      aiResponse = normalizeAIResponse(
        null,
        content.trim(),
        customFieldTemplate
      )
    }

    return {
      success: true,
      data: {
        prompt: resolvedPrompt,
        systemPrompt: resolvedSystemPrompt,
        answer: aiResponse.answer,
        explanation: aiResponse.explanation,
        confidence: aiResponse.confidence,
        details: aiResponse.data,
        custom_fields: aiResponse.custom_fields,
        metadata: aiResponse.metadata,
        questionType: aiResponse.metadata?.question_type || 'other'
      }
    }
  } catch (error: any) {
    console.log('ERR', error)
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    }
  }
}
