'use client'

import { EdgeProps, getBezierPath, getSmoothStepPath } from '@xyflow/react'

const STEP_THRESHOLD_PX = 20

export function AdaptiveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd
}: EdgeProps) {
  const horizontalGap = targetX - sourceX
  const useStep = horizontalGap < STEP_THRESHOLD_PX

  const [edgePath] = useStep
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 8
      })
    : getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition
      })

  return (
    <path
      id={id}
      style={style}
      className='react-flow__edge-path'
      d={edgePath}
      markerEnd={markerEnd}
      fill='none'
    />
  )
}
