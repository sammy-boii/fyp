'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ===== Context for resolving nodeId → display label =====

type PlaceholderResolverContextType = {
  resolveNodeLabel: (nodeId: string) => string
}

const PlaceholderResolverContext =
  React.createContext<PlaceholderResolverContextType>({
    resolveNodeLabel: (nodeId) => nodeId
  })

export function PlaceholderProvider({
  nodeMap,
  children
}: {
  nodeMap: Map<string, string>
  children: React.ReactNode
}) {
  const ctx = React.useMemo<PlaceholderResolverContextType>(
    () => ({
      resolveNodeLabel: (nodeId: string) => nodeMap.get(nodeId) || nodeId
    }),
    [nodeMap]
  )
  return (
    <PlaceholderResolverContext.Provider value={ctx}>
      {children}
    </PlaceholderResolverContext.Provider>
  )
}

export const usePlaceholderResolver = () =>
  React.useContext(PlaceholderResolverContext)

// ===== Parsing utilities =====

const PLACEHOLDER_SPLIT_RE = /(\{\{[^}]+\}\})/g
const PLACEHOLDER_MATCH_RE = /^\{\{([^}]+)\}\}$/

type Segment =
  | { type: 'text'; content: string }
  | { type: 'placeholder'; raw: string; nodeId: string; path: string }

function parseSegments(value: string): Segment[] {
  if (!value) return []
  const parts = value.split(PLACEHOLDER_SPLIT_RE)
  const segments: Segment[] = []
  for (const part of parts) {
    if (!part) continue
    const m = PLACEHOLDER_MATCH_RE.exec(part)
    if (m) {
      const content = m[1].trim()
      const dot = content.indexOf('.')
      if (dot !== -1) {
        segments.push({
          type: 'placeholder',
          raw: part,
          nodeId: content.substring(0, dot),
          path: content.substring(dot + 1)
        })
        continue
      }
    }
    segments.push({ type: 'text', content: part })
  }
  return segments
}

function parseSinglePlaceholder(raw: string) {
  const m = PLACEHOLDER_MATCH_RE.exec(raw)
  if (!m) return null
  const c = m[1].trim()
  const dot = c.indexOf('.')
  if (dot === -1) return null
  return { nodeId: c.substring(0, dot), path: c.substring(dot + 1) }
}

// ===== Chip styling =====

const CHIP_CLASS =
  'inline-flex items-center rounded px-1.5 py-0.5 mx-[2px] text-[11px] font-medium cursor-default align-middle whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50'

// ===== ContentEditable Editor =====

interface PlaceholderEditorProps {
  value?: string
  onChange?: (...args: any[]) => void
  onBlur?: (...args: any[]) => void
  onFocus?: (...args: any[]) => void
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
  disabled?: boolean
  multiline?: boolean
  rows?: number
  [key: string]: any
}

const PlaceholderEditor = React.forwardRef<
  HTMLDivElement,
  PlaceholderEditorProps
>(
  (
    {
      value = '',
      onChange,
      onBlur,
      onFocus,
      placeholder: placeholderText,
      className,
      'aria-invalid': ariaInvalid,
      disabled,
      multiline = false,
      rows
    },
    forwardedRef
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null)
    const { resolveNodeLabel } = usePlaceholderResolver()
    const lastValueRef = React.useRef(value)
    const [showPlaceholder, setShowPlaceholder] = React.useState(!value)

    // Merge forwarded ref with internal ref
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        ;(editorRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef)
          (
            forwardedRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node
      },
      [forwardedRef]
    )

    // ---- DOM helpers ----

    const makeChip = React.useCallback(
      (raw: string, nodeId: string, path: string): HTMLSpanElement => {
        const el = document.createElement('span')
        el.contentEditable = 'false'
        el.setAttribute('data-placeholder', raw)
        el.className = CHIP_CLASS
        el.textContent = `${resolveNodeLabel(nodeId)}.${path}`
        return el
      },
      [resolveNodeLabel]
    )

    const renderDOM = React.useCallback(
      (val: string) => {
        const root = editorRef.current
        if (!root) return
        root.innerHTML = ''
        if (!val) {
          setShowPlaceholder(true)
          return
        }
        const segs = parseSegments(val)
        for (const s of segs) {
          if (s.type === 'placeholder') {
            root.appendChild(makeChip(s.raw, s.nodeId, s.path))
          } else if (multiline) {
            const lines = s.content.split('\n')
            lines.forEach((line, i) => {
              if (i > 0) root.appendChild(document.createElement('br'))
              if (line) root.appendChild(document.createTextNode(line))
            })
          } else {
            root.appendChild(document.createTextNode(s.content))
          }
        }
        setShowPlaceholder(false)
      },
      [makeChip, multiline]
    )

    const serialize = React.useCallback((): string => {
      const root = editorRef.current
      if (!root) return ''
      let out = ''
      const walk = (node: Node, firstChild: boolean) => {
        if (node.nodeType === Node.TEXT_NODE) {
          out += node.textContent || ''
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          const ph = el.getAttribute('data-placeholder')
          if (ph) {
            out += ph
          } else if (el.tagName === 'BR') {
            if (multiline) out += '\n'
          } else if (el.tagName === 'DIV' || el.tagName === 'P') {
            if (!firstChild && multiline) out += '\n'
            el.childNodes.forEach((c, i) => walk(c, i === 0))
          } else {
            el.childNodes.forEach((c, i) => walk(c, i === 0))
          }
        }
      }
      root.childNodes.forEach((c, i) => walk(c, i === 0))
      return out.replace(/\u200B/g, '')
    }, [multiline])

    // ---- Sync value ↔ DOM ----

    // Initial render
    React.useEffect(() => {
      renderDOM(value)
      lastValueRef.current = value
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // External value changes (form reset, undo, etc.)
    React.useEffect(() => {
      if (lastValueRef.current !== value) {
        renderDOM(value)
        lastValueRef.current = value
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    // Re-render chip labels when resolver changes
    React.useEffect(() => {
      const root = editorRef.current
      if (!root) return
      root
        .querySelectorAll<HTMLSpanElement>('[data-placeholder]')
        .forEach((chip) => {
          const raw = chip.getAttribute('data-placeholder')
          if (!raw) return
          const p = parseSinglePlaceholder(raw)
          if (!p) return
          chip.textContent = `${resolveNodeLabel(p.nodeId)}.${p.path}`
        })
    }, [resolveNodeLabel])

    // ---- Emit change ----

    const emit = React.useCallback(() => {
      const v = serialize()
      setShowPlaceholder(!v)
      if (v !== lastValueRef.current) {
        lastValueRef.current = v
        onChange?.(v)
      }
    }, [serialize, onChange])

    // ---- Insert helper ----

    const insertNodes = React.useCallback((nodes: Node[]) => {
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return
      const range = sel.getRangeAt(0)
      range.deleteContents()
      const frag = document.createDocumentFragment()
      nodes.forEach((n) => frag.appendChild(n))
      const lastNode = frag.lastChild
      range.insertNode(frag)
      if (lastNode) {
        range.setStartAfter(lastNode)
        range.collapse(true)
      }
      sel.removeAllRanges()
      sel.addRange(range)
    }, [])

    // ---- Event handlers ----

    const handleInput = React.useCallback(() => emit(), [emit])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault()
        }
      },
      [multiline]
    )

    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        if (!text) return

        const segs = parseSegments(text)
        const nodes: Node[] = []
        for (const s of segs) {
          if (s.type === 'placeholder') {
            nodes.push(makeChip(s.raw, s.nodeId, s.path))
          } else if (multiline) {
            const lines = s.content.split('\n')
            lines.forEach((line, i) => {
              if (i > 0) nodes.push(document.createElement('br'))
              if (line) nodes.push(document.createTextNode(line))
            })
          } else {
            nodes.push(
              document.createTextNode(s.content.replace(/[\n\r]/g, ' '))
            )
          }
        }
        insertNodes(nodes)
        emit()
      },
      [makeChip, multiline, insertNodes, emit]
    )

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const text = e.dataTransfer.getData('text/plain')
        if (!text) return

        editorRef.current?.focus()

        // Position caret at drop point
        const caret = document.caretRangeFromPoint(e.clientX, e.clientY)
        if (caret) {
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(caret)
        }

        const segs = parseSegments(text)
        const nodes: Node[] = []
        for (const s of segs) {
          if (s.type === 'placeholder') {
            nodes.push(makeChip(s.raw, s.nodeId, s.path))
          } else {
            nodes.push(document.createTextNode(s.content))
          }
        }
        insertNodes(nodes)
        emit()
      },
      [makeChip, insertNodes, emit]
    )

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }, [])

    // ---- Styles ----

    const style: React.CSSProperties = {}
    if (multiline && rows) {
      style.minHeight = `${Math.max(rows * 1.5 + 1, 4)}rem`
    }
    if (!multiline) {
      style.scrollbarWidth = 'none'
    }

    return (
      <div className='relative w-full'>
        <div
          ref={setRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-slot='input'
          onInput={handleInput}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setShowPlaceholder(!serialize())
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setShowPlaceholder(!serialize())
            onBlur?.(e)
          }}
          role='textbox'
          aria-invalid={ariaInvalid || undefined}
          aria-multiline={multiline || undefined}
          style={style}
          className={cn(
            'w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm',
            'border-input dark:bg-input/30',
            'focus:border-ring focus:ring-ring/50 focus:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            disabled && 'pointer-events-none cursor-not-allowed opacity-50',
            multiline
              ? 'min-h-16 py-2 whitespace-pre-wrap wrap-break-word'
              : 'min-h-9 py-1 overflow-hidden whitespace-nowrap leading-7',
            !multiline && '[&::-webkit-scrollbar]:hidden',
            className
          )}
        />
        {showPlaceholder && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 select-none text-muted-foreground text-base md:text-sm',
              multiline ? 'px-3 py-2' : 'flex items-center px-3 py-1'
            )}
            onClick={() => editorRef.current?.focus()}
          >
            {placeholderText}
          </div>
        )}
      </div>
    )
  }
)

PlaceholderEditor.displayName = 'PlaceholderEditor'

// ===== Public API =====

function PlaceholderInput(
  props: Omit<PlaceholderEditorProps, 'multiline' | 'rows'>
) {
  return <PlaceholderEditor {...props} multiline={false} />
}

function PlaceholderTextarea(props: Omit<PlaceholderEditorProps, 'multiline'>) {
  return <PlaceholderEditor {...props} multiline />
}

export { PlaceholderInput, PlaceholderTextarea }
