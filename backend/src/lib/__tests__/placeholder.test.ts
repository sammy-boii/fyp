import { describe, expect, it } from 'vitest'
import {
  buildNodeOutputsMap,
  findPredecessorNodes,
  getValueByPath,
  replacePlaceholdersInConfig,
  replacePlaceholdersInString
} from '../placeholder'

describe('placeholder utils (backend)', () => {
  it('reads nested values including array paths', () => {
    const payload = {
      email: {
        subject: 'Meeting update',
        recipients: [{ address: 'test@example.com' }]
      }
    }

    expect(getValueByPath(payload, 'email.subject')).toBe('Meeting update')
    expect(getValueByPath(payload, 'email.recipients[0].address')).toBe(
      'test@example.com'
    )
    expect(
      getValueByPath(payload, 'email.recipients[1].address')
    ).toBeUndefined()
  })

  it('replaces placeholders in plain strings and keeps unknown placeholders intact', () => {
    const outputs = new Map<string, Record<string, any>>([
      [
        'nodeA',
        {
          answer: 'Hello from node A',
          details: { confidence: 'high' }
        }
      ]
    ])

    const value =
      'Answer: {{nodeA.answer}} ({{nodeA.details.confidence}}) {{missing.answer}}'

    expect(replacePlaceholdersInString(value, outputs)).toBe(
      'Answer: Hello from node A (high) {{missing.answer}}'
    )
  })

  it('replaces placeholders recursively in config objects and arrays', () => {
    const outputs = new Map<string, Record<string, any>>([
      ['n1', { title: 'Report', tags: ['alpha', 'beta'] }]
    ])

    const config = {
      subject: '{{n1.title}} ready',
      metadata: {
        primaryTag: '{{n1.tags[0]}}'
      },
      list: ['first', '{{n1.tags[1]}}']
    }

    expect(replacePlaceholdersInConfig(config, outputs)).toEqual({
      subject: 'Report ready',
      metadata: {
        primaryTag: 'alpha'
      },
      list: ['first', 'beta']
    })
  })

  it('finds predecessor nodes and builds outputs map for dependency chain', () => {
    const edges = [
      { source: 'trigger', target: 'node1' },
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' }
    ] as any

    const predecessors = findPredecessorNodes('node3', edges)
    expect(new Set(predecessors)).toEqual(
      new Set(['trigger', 'node1', 'node2'])
    )

    const nodes = [
      { id: 'trigger', data: { lastOutput: { id: 1 } } },
      { id: 'node1', data: { lastOutput: { id: 2 } } },
      { id: 'node2', data: { lastOutput: { id: 3 } } },
      { id: 'node3', data: { lastOutput: { id: 4 } } }
    ] as any

    const map = buildNodeOutputsMap('node3', nodes, edges)
    expect(map.has('trigger')).toBe(true)
    expect(map.has('node1')).toBe(true)
    expect(map.has('node2')).toBe(true)
    expect(map.has('node3')).toBe(false)
  })

  it('keeps invalid placeholders intact and stringifies object values', () => {
    const outputs = new Map<string, Record<string, any>>([
      [
        'nodeA',
        {
          answer: { text: 'Hello' },
          score: 99
        }
      ]
    ])

    const value =
      'Invalid={{justpath}} object={{nodeA.answer}} score={{nodeA.score}}'

    expect(replacePlaceholdersInString(value, outputs)).toBe(
      'Invalid={{justpath}} object={"text":"Hello"} score=99'
    )
  })

  it('returns unique predecessors when graph contains a cycle', () => {
    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
      { source: 'node3', target: 'node1' }
    ] as any

    const predecessors = findPredecessorNodes('node3', edges)
    const unique = new Set(predecessors)

    expect(unique).toEqual(new Set(['node1', 'node2', 'node3']))
  })
})
