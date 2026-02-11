import { TNodeExecutionResult } from '../types/workflow.types'
import { replacePlaceholdersInConfig } from '../lib/placeholder'
import { generateWithGemini, generateWithHuggingFace } from '../lib/ai-client'

interface AIConfig {
  prompt: string
}

interface AIResponse {
  answer: string
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  data: Record<string, any>
  metadata: {
    question_type: string
  }
}

const SYSTEM_PROMPT = `You are a helpful AI assistant that ALWAYS responds in valid JSON format.

RESPONSE FORMAT (use this exact structure for ALL responses):
{
  "answer": "the direct/primary answer to the question",
  "explanation": "detailed reasoning or context",
  "confidence": "high/medium/low (your confidence in this answer)",
  "data": {
    // Include ANY relevant fields here based on the question
    // Examples: "category", "score", "items", "summary", "keywords", etc.
  },
  "metadata": {
    "question_type": "classification/generation/extraction/analysis/other"
  }
}

RULES:
- Never use markdown code blocks (no \`\`\`json)
- Always include all 5 fields: answer, explanation, confidence, data, metadata
- Put specific details in the "data" object
- Keep "answer" concise (1-2 sentences max)
- Make "explanation" more detailed
`

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

    // Resolve placeholders in prompt
    const resolvedPrompt = replacePlaceholdersInConfig({ prompt }, nodeOutputs)
      .prompt as string

    const content = process.env.GEMINI_API_KEY
      ? await generateWithGemini({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: resolvedPrompt,
          maxTokens: 800,
          temperature: 0.3,
          responseMimeType: 'application/json'
        })
      : await generateWithHuggingFace({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: resolvedPrompt,
          maxTokens: 800,
          temperature: 0.3
        })

    // Clean and parse response - remove any markdown code blocks
    let normalizedContent = content
      .replace(/```json\n?/g, '')
      .replace(/\n?```/g, '')
      .trim()

    let aiResponse: AIResponse

    try {
      aiResponse = JSON.parse(normalizedContent)
    } catch (parseError) {
      // If parsing fails, return the raw content as the answer
      aiResponse = {
        answer: normalizedContent,
        explanation: 'Raw response (JSON parsing failed)',
        confidence: 'medium',
        data: { raw: normalizedContent },
        metadata: { question_type: 'other' }
      }
    }

    return {
      success: true,
      data: {
        prompt: resolvedPrompt,
        answer: aiResponse.answer,
        explanation: aiResponse.explanation,
        confidence: aiResponse.confidence,
        details: aiResponse.data,
        questionType: aiResponse.metadata?.question_type || 'other',
        fullResponse: aiResponse
      }
    }
  } catch (error: any) {
    console.log('ErROR', error)
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    }
  }
}
