'use client'

import { EdgeProps } from '@xyflow/react'

export function CurvyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd
}: EdgeProps) {
  // Calculate a curvier path than smoothstep
  // Using cubic bezier curves with more pronounced curves

  const dx = targetX - sourceX
  const dy = targetY - sourceY

  // Calculate curve intensity - make it curvier than smoothstep
  // Using 70% of the distance for control points (smoothstep uses ~50%)
  const curveIntensity = Math.min(
    Math.max(Math.abs(dx), Math.abs(dy)) * 0.7,
    200
  )

  const verticalOffset = Math.abs(dy) * 0.5 + 30 // Extra curve for more pronounced effect

  // Create a smooth S-curve with two control points
  const controlPoint1X = sourceX + curveIntensity * 0.5
  const controlPoint1Y = sourceY + (dy > 0 ? verticalOffset : -verticalOffset)

  const controlPoint2X = targetX - curveIntensity * 0.5
  const controlPoint2Y = targetY + (dy > 0 ? -verticalOffset : verticalOffset)

  const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${targetX} ${targetY}`

  return (
    <path
      id={id}
      style={style}
      className='react-flow__edge-path'
      d={path}
      markerEnd={markerEnd}
      fill='none'
    />
  )
}
