import { describe, expect, it } from 'vitest'
import {
  createPlaceholder,
  extractLeadingCanonicalPlaceholder,
  extractLeadingCanonicalPlaceholders,
  extractPlaceholders,
  isCanonicalPlaceholder,
  formatPlaceholderForDisplay,
  formatValueForDisplay,
  getValueByPath,
  replacePlaceholders
} from '../placeholder-utils'

describe('placeholder utils (frontend)', () => {
  it('extracts explicit and implicit placeholder formats', () => {
    const text =
      'Use {{nodeA.answer}} and {{summary}} then {{nodeB.details.score}}.'

    expect(extractPlaceholders(text)).toEqual([
      {
        fullMatch: '{{nodeA.answer}}',
        nodeId: 'nodeA',
        path: 'answer'
      },
      {
        fullMatch: '{{summary}}',
        nodeId: '',
        path: 'summary'
      },
      {
        fullMatch: '{{nodeB.details.score}}',
        nodeId: 'nodeB',
        path: 'details.score'
      }
    ])
  })

  it('replaces placeholders with values and uses default node when node id is omitted', () => {
    const outputs = new Map<string, { output: Record<string, any> }>([
      ['nodeA', { output: { answer: 'Done', details: { score: 91 } } }],
      ['prev', { output: { summary: 'Fallback summary' } }]
    ])

    const result = replacePlaceholders(
      'A={{nodeA.answer}} score={{nodeA.details.score}} summary={{summary}}',
      outputs,
      'prev'
    )

    expect(result).toBe('A=Done score=91 summary=Fallback summary')
  })

  it('creates and parses leading canonical placeholders', () => {
    const tokenA = createPlaceholder('nodeA', 'answer')
    const tokenB = createPlaceholder('nodeB', 'status')

    expect(tokenA).toBe('{{nodeA.answer}}')
    expect(extractLeadingCanonicalPlaceholder('{{nodeA.answer}}-tail')).toEqual(
      {
        token: '{{nodeA.answer}}',
        remainder: '-tail'
      }
    )

    expect(
      extractLeadingCanonicalPlaceholders(`${tokenA}${tokenB}-suffix`)
    ).toEqual({
      tokens: ['{{nodeA.answer}}', '{{nodeB.status}}'],
      remainder: '-suffix'
    })
  })

  it('formats placeholders and display values for UI', () => {
    const label = formatPlaceholderForDisplay('{{nodeA.output}}', (nodeId) =>
      nodeId === 'nodeA' ? 'Ask AI' : nodeId
    )

    expect(label).toBe('Ask AI.output')
    expect(formatValueForDisplay('x'.repeat(60))).toBe(`${'x'.repeat(50)}...`)
    expect(formatValueForDisplay(['a', 'b'])).toBe('[Array: 2 items]')
    expect(formatValueForDisplay({ ok: true })).toBe('[Object]')
  })

  it('keeps unknown placeholders unchanged and stringifies object replacements', () => {
    const outputs = new Map<string, { output: Record<string, any> }>([
      ['nodeA', { output: { answer: { text: 'done' } } }]
    ])

    const result = replacePlaceholders(
      'obj={{nodeA.answer}} missing={{nodeA.missing}}',
      outputs
    )

    expect(result).toBe('obj={"text":"done"} missing={{nodeA.missing}}')
  })

  it('validates canonical placeholders and resolves nested path values', () => {
    expect(isCanonicalPlaceholder('{{nodeA.answer}}')).toBe(true)
    expect(isCanonicalPlaceholder('{{nodeA.answer}}-x')).toBe(false)

    const payload = {
      summary: {
        top: [{ title: 'A' }]
      }
    }

    expect(getValueByPath(payload, 'summary.top[0].title')).toBe('A')
    expect(getValueByPath(payload, 'summary.top[1].title')).toBeUndefined()
  })
})
