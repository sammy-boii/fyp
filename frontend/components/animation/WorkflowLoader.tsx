'use client'

import { useEffect, useState } from 'react'

const ANIM_NODES = [
  { color: '#21676c' },
  { color: '#697585' },
  { color: '#416185' },
  { color: '#504185' },
  { color: '#644185' },
  { color: '#21676c' }
]

const EDGE_PAIRS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 4],
  [4, 5]
]

const NODE_POSITIONS = [
  { x: 60, y: 140 },
  { x: 230, y: 140 },
  { x: 400, y: 140 },
  { x: 570, y: 65 },
  { x: 570, y: 215 },
  { x: 840, y: 140 }
]

const SLIDE_OFFSET = NODE_POSITIONS[5].x - NODE_POSITIONS[0].x // 680

const NODE_W = 120
const NODE_H = 50
const NODE_R = 10

// ── Animated edge ──────────────────────────────────────────────────────────
function AnimatedEdge({
  x1,
  y1,
  x2,
  y2,
  visible
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  visible: boolean
}) {
  const midX = (x1 + x2) / 2
  const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

  // Approximate path length for dasharray
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) * 1.3

  return (
    <g>
      {/* Background track */}
      <path
        d={d}
        fill='none'
        stroke='#c5cce0'
        strokeWidth={2}
        opacity={visible ? 0.35 : 0}
        style={{ transition: 'opacity 0.3s ease' }}
      />
      {/* Drawing line */}
      <path
        d={d}
        fill='none'
        stroke='#9aa5c4'
        strokeWidth={2.5}
        strokeLinecap='round'
        strokeDasharray={len}
        strokeDashoffset={visible ? 0 : len}
        style={{
          transition: 'stroke-dashoffset 0.6s ease-out',
          opacity: visible ? 1 : 0
        }}
      />
      {/* Traveling dot */}
      {visible && (
        <circle r={3} fill='#8090b0' opacity={0.85}>
          <animateMotion dur='2s' repeatCount='indefinite' path={d} />
        </circle>
      )}
      {/* Arrow at end */}
      {visible && (
        <circle
          cx={x2}
          cy={y2}
          r={3.5}
          fill='#9aa5c4'
          opacity={0.65}
          style={{
            transition: 'opacity 0.3s ease 0.5s'
          }}
        />
      )}
    </g>
  )
}

// ── Animated node ──────────────────────────────────────────────────────────
function AnimatedNode({
  color,
  x,
  y,
  visible
}: {
  color: string
  x: number
  y: number
  visible: boolean
  pulsing: boolean
}) {
  return (
    <g
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.5)',
        transformOrigin: `${x + NODE_W / 2}px ${y + NODE_H / 2}px`,
        transition:
          'opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)'
      }}
    >
      {/* Shadow */}
      <rect
        x={x + 2}
        y={y + 3}
        width={NODE_W}
        height={NODE_H}
        rx={NODE_R}
        fill='#00000015'
      />
      {/* Node body */}
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={NODE_R}
        fill={color}
        stroke='#00000010'
        strokeWidth={1.5}
      ></rect>

      {/* Left handle */}
      <rect
        x={x - 4}
        y={y + NODE_H / 2 - 10}
        width={5}
        height={20}
        rx={2}
        fill='#9ca3af'
        opacity={visible ? 0.7 : 0}
        style={{ transition: 'opacity 0.3s ease 0.2s' }}
      />
      {/* Right handle */}
      <circle
        cx={x + NODE_W}
        cy={y + NODE_H / 2}
        r={5}
        fill='#9ca3af'
        opacity={visible ? 0.7 : 0}
        style={{ transition: 'opacity 0.3s ease 0.2s' }}
      />
    </g>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WorkflowLoader({
  text = 'Building workflow',
  showText = true
}: {
  text?: string
  showText?: boolean
}) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [cycle, setCycle] = useState(0)

  const totalNodes = ANIM_NODES.length
  const totalEdges = EDGE_PAIRS.length

  // Stagger: nodes first, then edges, slide left, then reset
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (visibleCount < totalNodes) {
      timeout = setTimeout(
        () => setVisibleCount((c) => c + 1),
        visibleCount === 0 ? 300 : 350
      )
    } else if (edgeCount < totalEdges) {
      timeout = setTimeout(() => setEdgeCount((c) => c + 1), 320)
    } else if (!sliding) {
      // Hold complete state, then start sliding
      timeout = setTimeout(() => setSliding(true), 1500)
    } else {
      // After slide completes, reset instantly and start new cycle
      timeout = setTimeout(() => {
        setVisibleCount(1) // Start with first node visible
        setEdgeCount(0)
        setSliding(false)
        setCycle((c) => c + 1)
      }, 700)
    }

    return () => clearTimeout(timeout)
  }, [visibleCount, edgeCount, sliding, totalNodes, totalEdges])

  // Animated dots
  const [dots, setDots] = useState('')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className='w-full h-full flex flex-col items-center justify-center gap-4 select-none overflow-hidden'>
      <svg
        viewBox='0 0 1060 300'
        className='w-full'
        xmlns='http://www.w3.org/2000/svg'
        style={{ overflow: 'visible' }}
      >
        <g
          style={{
            transform: sliding
              ? `translateX(-${SLIDE_OFFSET}px)`
              : 'translateX(0)',
            transition: sliding ? 'transform 0.6s ease-in-out' : 'none'
          }}
        >
          {/* Edges (rendered behind nodes) */}
          {EDGE_PAIRS.map(([fromIdx, toIdx], i) => {
            const from = NODE_POSITIONS[fromIdx]
            const to = NODE_POSITIONS[toIdx]
            return (
              <AnimatedEdge
                key={`${cycle}-e-${i}`}
                x1={from.x + NODE_W}
                y1={from.y + NODE_H / 2}
                x2={to.x}
                y2={to.y + NODE_H / 2}
                visible={i < edgeCount}
              />
            )
          })}

          {/* Nodes */}
          {ANIM_NODES.map((node, i) => (
            <AnimatedNode
              key={`${cycle}-n-${i}`}
              color={node.color}
              x={NODE_POSITIONS[i].x}
              y={NODE_POSITIONS[i].y}
              visible={i < visibleCount}
              pulsing={
                i === visibleCount - 1 &&
                visibleCount <= totalNodes &&
                edgeCount < totalEdges
              }
            />
          ))}
        </g>
      </svg>

      {showText && (
        <p className='text-sm pt-12 text-muted-foreground font-medium tracking-wide'>
          <span>{text}</span>
          <span className='inline-block w-5 text-left'>{dots}</span>
        </p>
      )}
    </div>
  )
}
