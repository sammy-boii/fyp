import { generateWorkflow } from '@/src/controllers/ai/generate-workflow'
import { Hono } from 'hono'

export const aiRoutes = new Hono()

// POST /api/ai/generate-workflow
aiRoutes.post('/generate-workflow', generateWorkflow)
