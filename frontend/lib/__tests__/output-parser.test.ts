import { describe, expect, it } from 'vitest'
import {
  formatValueByType,
  getAvailablePlaceholders,
  getValueType,
  keyToLabel,
  parseNodeOutput
} from '../output-parser'

describe('output parser (frontend)', () => {
  it('detects primitive and complex value types', () => {
    expect(getValueType('abc')).toBe('string')
    expect(getValueType(10)).toBe('number')
    expect(getValueType(true)).toBe('boolean')
    expect(getValueType(null)).toBe('null')
    expect(getValueType(undefined)).toBe('null')
    expect(getValueType([1, 2])).toBe('array')
    expect(getValueType({ a: 1 })).toBe('object')
    expect(getValueType(Symbol('x'))).toBe('unknown')
  })

  it('converts keys to human-readable labels', () => {
    expect(keyToLabel('messageId')).toBe('Message Id')
    expect(keyToLabel('created_at-time')).toBe('Created at time')
  })

  it('parses nested output with arrays and objects', () => {
    const output = {
      message: 'done',
      tags: ['a', 'b'],
      meta: { score: 9 },
      items: [{ id: 1 }, { id: 2 }]
    }

    const parsed = parseNodeOutput(undefined, output)

    expect(parsed.actionId).toBe('unknown')
    expect(parsed.fields.find((f) => f.key === 'message')?.type).toBe('string')

    const tags = parsed.fields.find((f) => f.key === 'tags')
    expect(tags?.type).toBe('array')
    expect(tags?.arrayLength).toBe(2)
    expect(tags?.children?.[0].path).toBe('tags.length')

    const meta = parsed.fields.find((f) => f.key === 'meta')
    expect(meta?.type).toBe('object')
    expect(meta?.children?.find((f) => f.path === 'meta.score')).toBeTruthy()
  })

  it('extracts placeholder paths from parsed output', () => {
    const output = {
      user: { name: 'Sam' },
      values: [1, 2]
    }

    const placeholders = getAvailablePlaceholders(undefined, output)
    const paths = new Set(placeholders.map((p) => p.path))

    expect(paths.has('user')).toBe(true)
    expect(paths.has('user.name')).toBe(true)
    expect(paths.has('values')).toBe(true)
    expect(paths.has('values.length')).toBe(true)
    expect(paths.has('values[0]')).toBe(true)
  })

  it('formats values by type for display', () => {
    expect(formatValueByType(null, 'null')).toBe('null')
    expect(formatValueByType(true, 'boolean')).toBe('true')
    expect(formatValueByType(7, 'number')).toBe('7')
    expect(formatValueByType([1, 2, 3], 'array')).toBe('Array [3 items]')

    const short = formatValueByType('ok', 'string')
    const long = formatValueByType('x'.repeat(101), 'string')
    expect(short).toBe('ok')
    expect(long.endsWith('...')).toBe(true)

    const obj = formatValueByType({ a: 1, b: 2, c: 3, d: 4 }, 'object')
    expect(obj).toBe('Object {a, b, c, ...}')
  })
})
