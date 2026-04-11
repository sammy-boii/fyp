'use client'

import { useFrame } from '@react-three/fiber'
import { type MutableRefObject, type ReactNode, useRef } from 'react'
import * as THREE from 'three'

interface ScrollReactiveRigProps {
  children: ReactNode
  progressRef: MutableRefObject<number>
  reducedMotion: boolean
}

export function ScrollReactiveRig({
  children,
  progressRef,
  reducedMotion
}: ScrollReactiveRigProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state, delta) => {
    const progress = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1)
    const motionIntensity = reducedMotion ? 0.38 : 1
    const travelProgress = THREE.MathUtils.smoothstep(progress, 0.05, 0.76)
    const panelFocus = THREE.MathUtils.smoothstep(progress, 0.62, 0.98)
    const colonyFocus = THREE.MathUtils.smoothstep(progress, 0.7, 1)
    const billboardFocus = THREE.MathUtils.smoothstep(progress, 0.78, 1)

    if (groupRef.current) {
      const animatedRotationX = THREE.MathUtils.lerp(
        -0.24,
        -0.05,
        travelProgress
      )
      const animatedRotationY = (travelProgress - 0.5) * 0.05
      const animatedY =
        THREE.MathUtils.lerp(-1.08, -0.5, travelProgress) + panelFocus * 0.03
      const animatedZ = THREE.MathUtils.lerp(-2.86, -0.6, travelProgress)

      const targetRotationX = THREE.MathUtils.lerp(
        -0.14,
        animatedRotationX,
        motionIntensity
      )
      const targetRotationY = THREE.MathUtils.lerp(
        0,
        animatedRotationY,
        motionIntensity
      )
      const targetY = THREE.MathUtils.lerp(0.02, animatedY, motionIntensity)
      const targetZ = THREE.MathUtils.lerp(-1.2, animatedZ, motionIntensity)

      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetRotationX,
        3.2,
        delta
      )

      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY,
        3,
        delta
      )

      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        2.4,
        delta
      )

      groupRef.current.position.z = THREE.MathUtils.damp(
        groupRef.current.position.z,
        targetZ,
        2.6,
        delta
      )
    }

    const camera = state.camera as THREE.PerspectiveCamera

    const sceneCameraX = THREE.MathUtils.lerp(0, 1.08, colonyFocus)
    const sceneCameraY =
      THREE.MathUtils.lerp(0.14, 0.34, travelProgress) + panelFocus * 0.01
    const sceneCameraZ = THREE.MathUtils.lerp(9.4, 5.8, panelFocus)
    const animatedCameraX = THREE.MathUtils.lerp(
      sceneCameraX,
      2.62,
      billboardFocus
    )
    const animatedCameraY = THREE.MathUtils.lerp(
      sceneCameraY,
      0.82,
      billboardFocus
    )
    const animatedCameraZ = THREE.MathUtils.lerp(
      sceneCameraZ,
      4.36,
      billboardFocus
    )

    const targetCameraX = THREE.MathUtils.lerp(
      0,
      animatedCameraX,
      motionIntensity
    )

    const targetCameraY = THREE.MathUtils.lerp(
      0.16,
      animatedCameraY,
      motionIntensity
    )
    const targetCameraZ = THREE.MathUtils.lerp(
      8.95,
      animatedCameraZ,
      motionIntensity
    )

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetCameraX,
      2.4,
      delta
    )

    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetCameraY,
      2.4,
      delta
    )

    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetCameraZ,
      2.6,
      delta
    )

    const sceneLookAtX = THREE.MathUtils.lerp(0, 1.72, colonyFocus)
    const sceneLookAtY = THREE.MathUtils.lerp(0.04, 0.12, panelFocus)
    const sceneLookAtZ = THREE.MathUtils.lerp(0.2, 2.1, panelFocus)
    const targetLookAtX = THREE.MathUtils.lerp(
      sceneLookAtX,
      2.14,
      billboardFocus
    )
    const targetLookAtY = THREE.MathUtils.lerp(
      sceneLookAtY,
      0.56,
      billboardFocus
    )
    const targetLookAtZ = THREE.MathUtils.lerp(
      sceneLookAtZ,
      1.9,
      billboardFocus
    )

    lookAtRef.current.x = THREE.MathUtils.damp(
      lookAtRef.current.x,
      targetLookAtX,
      2.8,
      delta
    )
    lookAtRef.current.y = THREE.MathUtils.damp(
      lookAtRef.current.y,
      targetLookAtY,
      2.8,
      delta
    )
    lookAtRef.current.z = THREE.MathUtils.damp(
      lookAtRef.current.z,
      targetLookAtZ,
      2.8,
      delta
    )

    const sceneFov = THREE.MathUtils.lerp(45, 41, panelFocus)
    const zoomFov = THREE.MathUtils.lerp(sceneFov, 36, billboardFocus)
    const targetFov = THREE.MathUtils.lerp(44, zoomFov, motionIntensity)
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 2.6, delta)
    camera.updateProjectionMatrix()

    camera.lookAt(lookAtRef.current)
  })

  return <group ref={groupRef}>{children}</group>
}
