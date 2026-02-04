import { InferenceClient } from '@huggingface/inference'
import { TNodeExecutionResult } from '../types/workflow.types'
import { replacePlaceholdersInConfig } from '../lib/placeholder'

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

const HF_TOKEN = process.env.HF_TOKEN

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

    if (!HF_TOKEN) {
      return {
        success: false,
        error: 'HF_TOKEN environment variable is not set'
      }
    }

    // Resolve placeholders in prompt
    const resolvedPrompt = replacePlaceholdersInConfig({ prompt }, nodeOutputs)
      .prompt as string

    // Use HuggingFace Inference Client
    const client = new InferenceClient(HF_TOKEN)

    const response = await client.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: resolvedPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    // Extract content from response
    let content = response.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return {
        success: false,
        error: 'No response from AI'
      }
    }

    // Clean and parse response - remove any markdown code blocks
    content = content
      .replace(/```json\n?/g, '')
      .replace(/\n?```/g, '')
      .trim()

    let aiResponse: AIResponse

    try {
      aiResponse = JSON.parse(content)
    } catch (parseError) {
      // If parsing fails, return the raw content as the answer
      aiResponse = {
        answer: content,
        explanation: 'Raw response (JSON parsing failed)',
        confidence: 'medium',
        data: { raw: content },
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
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    }
  }
}
