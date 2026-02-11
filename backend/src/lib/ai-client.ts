import { GoogleGenAI } from '@google/genai'
import { InferenceClient } from '@huggingface/inference'

type AICompletionOptions = {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  model?: string
  responseMimeType?: string
}

const DEFAULT_HF_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite'

export async function generateWithHuggingFace(
  options: AICompletionOptions
): Promise<string> {
  const token = process.env.HF_TOKEN
  if (!token) {
    throw new Error('HF_TOKEN environment variable is not set')
  }

  const client = new InferenceClient(token)
  const response = await client.chatCompletion({
    model: options.model ?? DEFAULT_HF_MODEL,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt }
    ],
    max_tokens: options.maxTokens ?? 800,
    temperature: options.temperature ?? 0.3
  })

  const content = response.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No response from AI')
  }

  return content
}

export async function generateWithGemini(
  options: AICompletionOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: options.model ?? DEFAULT_GEMINI_MODEL,
    contents: options.userPrompt,
    config: {
      systemInstruction: options.systemPrompt,
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens ?? 800,
      ...(options.responseMimeType
        ? { responseMimeType: options.responseMimeType }
        : {})
    }
  })

  console.log('RES', response)

  const text = response.text?.trim()
  if (!text) {
    throw new Error('No response from AI')
  }

  return text
}
