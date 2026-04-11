'use client'

import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface MeshPalette {
  background: string
  fog: string
  primary: string
  secondary: string
  meshLine: string
  meshAccent: string
  dotColor: string
  lightSoft: string
}

interface MeshNetworkProps {
  palette: MeshPalette
  progressRef: MutableRefObject<number>
  reducedMotion: boolean
}

const DOT_COUNT = 980
const NEAR_PARTICLE_COUNT = 220

const TERRAIN_BEACONS: Array<[number, number, number, number]> = [
  [-4.2, -0.9, 0.4, 0.22],
  [-3.1, -0.74, 0.92, 0.18],
  [-2.2, -0.62, 1.28, 0.15],
  [-1.05, -0.56, 1.02, 0.14],
  [0.15, -0.52, 1.36, 0.16],
  [1.3, -0.58, 1.18, 0.13],
  [2.45, -0.66, 0.86, 0.17],
  [3.5, -0.82, 0.5, 0.2],
  [-2.84, -0.54, 1.72, 0.12],
  [2.96, -0.56, 1.58, 0.11]
]

const TERRAIN_DEBRIS: Array<[number, number, number, number, number]> = [
  [-4.9, -1.04, 0.56, 0.22, 0.24],
  [-4.2, -1.0, 1.02, 0.2, -0.18],
  [-3.6, -0.98, 1.5, 0.18, 0.42],
  [-2.8, -0.94, 1.86, 0.24, -0.34],
  [-2.2, -0.98, 0.72, 0.2, 0.26],
  [-1.4, -0.92, 1.24, 0.16, -0.48],
  [-0.6, -0.9, 1.84, 0.18, 0.2],
  [0.18, -0.92, 1.62, 0.2, -0.3],
  [0.98, -0.9, 0.92, 0.16, 0.36],
  [1.72, -0.94, 1.42, 0.2, -0.22],
  [2.48, -0.98, 0.78, 0.18, 0.48],
  [3.2, -1.02, 1.18, 0.22, -0.16],
  [3.88, -1.04, 0.58, 0.24, 0.3],
  [4.34, -1, 1.52, 0.18, -0.38]
]

const SCREEN_WORKFLOW_NODES: Array<[number, number, number]> = [
  [-2.2, 0.95, 0.02],
  [-1.2, 0.58, 0.02],
  [-0.25, 0.86, 0.02],
  [0.82, 0.36, 0.02],
  [1.92, 0.72, 0.02],
  [-1.74, -0.3, 0.02],
  [-0.72, -0.14, 0.02],
  [0.45, -0.42, 0.02],
  [1.48, -0.2, 0.02]
]

const SCREEN_WORKFLOW_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [2, 6],
  [3, 7],
  [4, 8]
]

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const terrainHeight = (x: number, y: number, layer: 'primary' | 'accent') => {
  const horizonMask = smoothstep(-7, 18, y)
  const xWave = x * 0.08
  const yWave = y * 0.06

  const macro =
    Math.sin(xWave * 0.72 + yWave * 0.36) * 0.9 +
    Math.cos(xWave * 0.26 - yWave * 0.6) * 0.75

  const ridges =
    Math.abs(Math.sin(x * 0.092 + y * 0.18)) *
    (layer === 'primary' ? 1.35 : 0.92)

  const sideSlope = Math.sin(x * 0.03) * 0.5

  const basin =
    Math.exp(-(x * x * 0.006 + (y + 2.8) * (y + 2.8) * 0.012)) *
    (layer === 'primary' ? 1.4 : 0.9)

  const horizonRise =
    Math.pow(horizonMask, 1.8) * (layer === 'primary' ? 4.2 : 2.8)

  return (
    horizonRise +
    (macro * 0.42 + ridges * 0.54 + sideSlope * 0.34) * horizonMask -
    basin
  )
}

const createLabelTexture = (text: string, color: string) => {
  if (typeof document === 'undefined') {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(0, 0, 0, 0)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '700 98px "Space Grotesk", "Segoe UI", sans-serif'
  context.letterSpacing = '8px'
  context.fillStyle = color
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

const FALLBACK_TEXTURE_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+9T8AAAAASUVORK5CYII='

const patchBlobTextureUrls = (loader: any) => {
  loader.manager.setURLModifier((url: string) => {
    if (url.startsWith('blob:')) {
      return FALLBACK_TEXTURE_DATA_URI
    }

    return url
  })
}

const computeNormalizedScale = (scene: THREE.Object3D, targetSize: number) => {
  const bounds = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  bounds.getSize(size)

  const maxDim = Math.max(size.x, size.y, size.z, 0.0001)
  return targetSize / maxDim
}

export function MeshNetwork({
  palette,
  progressRef,
  reducedMotion
}: MeshNetworkProps) {
  const primaryTerrainRef = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null)
  const accentTerrainRef = useRef<THREE.Mesh<THREE.PlaneGeometry>>(null)
  const pointsRef = useRef<THREE.Points<THREE.BufferGeometry>>(null)
  const nearParticlesRef = useRef<THREE.Points<THREE.BufferGeometry>>(null)

  const jellyfishRef = useRef<THREE.Group>(null)
  const roverRef = useRef<THREE.Group>(null)
  const billboardRef = useRef<THREE.Group>(null)
  const debrisRefs = useRef<Array<THREE.Group | null>>([])

  const jellyfishGltf = useGLTF(
    '/models/jellyfish.glb',
    undefined,
    undefined,
    patchBlobTextureUrls
  )
  const roverGltf = useGLTF(
    '/models/rover.glb',
    undefined,
    undefined,
    patchBlobTextureUrls
  )
  const jellyfishScale = useMemo(
    () => computeNormalizedScale(jellyfishGltf.scene, 2.9),
    [jellyfishGltf.scene]
  )

  const roverScale = useMemo(
    () => computeNormalizedScale(roverGltf.scene, 1.04),
    [roverGltf.scene]
  )

  const monitorGroupRef = useRef<THREE.Group>(null)
  const loaderGroupRef = useRef<THREE.Group>(null)
  const loaderProgressRef = useRef<THREE.Mesh>(null)
  const loaderMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const loaderWaveRefs = useRef<Array<THREE.Mesh | null>>([])
  const loaderWaveMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>(
    []
  )
  const loaderOrbitRef = useRef<THREE.Group>(null)

  const workflowGroupRef = useRef<THREE.Group>(null)
  const workflowLineMaterialRef = useRef<THREE.LineBasicMaterial>(null)
  const workflowNodeRefs = useRef<Array<THREE.Mesh | null>>([])
  const workflowNodeMaterialRefs = useRef<
    Array<THREE.MeshBasicMaterial | null>
  >([])
  const workflowButtonFillRef = useRef<THREE.MeshBasicMaterial>(null)
  const workflowButtonStrokeRef = useRef<THREE.MeshBasicMaterial>(null)
  const loaderLabelMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const startLabelMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const terrainBeaconRefs = useRef<Array<THREE.Mesh | null>>([])
  const terrainBeaconMaterialRefs = useRef<
    Array<THREE.MeshBasicMaterial | null>
  >([])

  const primaryTerrainBaseRef = useRef<Float32Array | null>(null)
  const accentTerrainBaseRef = useRef<Float32Array | null>(null)

  const workflowLinesGeometry = useMemo(() => {
    const segments: number[] = []

    SCREEN_WORKFLOW_EDGES.forEach(([sourceIndex, targetIndex]) => {
      const source = SCREEN_WORKFLOW_NODES[sourceIndex]
      const target = SCREEN_WORKFLOW_NODES[targetIndex]

      segments.push(source[0], source[1], source[2])
      segments.push(target[0], target[1], target[2])
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segments, 3)
    )

    return geometry
  }, [])

  const { pointsGeometry, pointBase } = useMemo(() => {
    const positions = new Float32Array(DOT_COUNT * 3)
    const base = new Float32Array(DOT_COUNT * 3)

    for (let i = 0; i < DOT_COUNT; i += 1) {
      const index = i * 3
      const radius = 10 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const x = Math.cos(theta) * radius
      const y = Math.sin(theta) * (radius * 0.58)
      const z = (Math.random() - 0.5) * 1.1

      positions[index] = x
      positions[index + 1] = y
      positions[index + 2] = z

      base[index] = x
      base[index + 1] = y
      base[index + 2] = z
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return {
      pointsGeometry: geometry,
      pointBase: base
    }
  }, [])

  const { nearParticlesGeometry, nearParticleBase } = useMemo(() => {
    const positions = new Float32Array(NEAR_PARTICLE_COUNT * 3)
    const base = new Float32Array(NEAR_PARTICLE_COUNT * 3)

    for (let i = 0; i < NEAR_PARTICLE_COUNT; i += 1) {
      const index = i * 3

      const x = (Math.random() - 0.5) * 16
      const y = -0.72 + Math.random() * 1.46
      const z = -0.35 + Math.random() * 3.1

      positions[index] = x
      positions[index + 1] = y
      positions[index + 2] = z

      base[index] = x
      base[index + 1] = y
      base[index + 2] = z
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return {
      nearParticlesGeometry: geometry,
      nearParticleBase: base
    }
  }, [])

  const loadingLabelTexture = useMemo(
    () => createLabelTexture('LOADING', palette.secondary),
    [palette.secondary]
  )

  const startDemoLabelTexture = useMemo(
    () => createLabelTexture('START DEMO', palette.secondary),
    [palette.secondary]
  )

  useEffect(() => {
    roverGltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) {
        return
      }

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]

      materials.forEach((material) => {
        if (!material) {
          return
        }

        if ('wireframe' in material) {
          ;(material as THREE.MeshBasicMaterial).wireframe = true
        }

        if ('color' in material) {
          ;(material as THREE.MeshBasicMaterial).color.set(palette.meshAccent)
        }

        material.transparent = true
        material.opacity = 0.86
        material.depthWrite = false
        material.needsUpdate = true
      })
    })
  }, [roverGltf.scene, palette.meshAccent])

  useEffect(() => {
    return () => {
      pointsGeometry.dispose()
      nearParticlesGeometry.dispose()
      workflowLinesGeometry.dispose()
      loadingLabelTexture?.dispose()
      startDemoLabelTexture?.dispose()
    }
  }, [
    pointsGeometry,
    nearParticlesGeometry,
    workflowLinesGeometry,
    loadingLabelTexture,
    startDemoLabelTexture
  ])

  useEffect(() => {
    const primaryAttr = primaryTerrainRef.current?.geometry.attributes
      .position as THREE.BufferAttribute | null
    const accentAttr = accentTerrainRef.current?.geometry.attributes
      .position as THREE.BufferAttribute | null

    if (primaryAttr) {
      const positions = primaryAttr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = terrainHeight(
          positions[i],
          positions[i + 1],
          'primary'
        )
      }

      primaryAttr.needsUpdate = true
      primaryTerrainBaseRef.current = new Float32Array(primaryAttr.array.length)
      primaryTerrainBaseRef.current.set(positions)
    }

    if (accentAttr) {
      const positions = accentAttr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] =
          terrainHeight(positions[i], positions[i + 1], 'accent') - 0.24
      }

      accentAttr.needsUpdate = true
      accentTerrainBaseRef.current = new Float32Array(accentAttr.array.length)
      accentTerrainBaseRef.current.set(positions)
    }
  }, [])

  useFrame((state, delta) => {
    const progress = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1)
    const elapsed = state.clock.elapsedTime
    const motionFactor = reducedMotion ? 0.35 : 1

    const panelFocus = THREE.MathUtils.clamp((progress - 0.72) / 0.28, 0, 1)
    const monitorCenterProgress = THREE.MathUtils.smoothstep(
      progress,
      0.34,
      0.98
    )
    const billboardFocus = THREE.MathUtils.smoothstep(progress, 0.74, 1)
    const loaderProgress = THREE.MathUtils.clamp(
      (progress - 0.74) / 0.22,
      0.01,
      1
    )
    const workflowReveal = THREE.MathUtils.smoothstep(progress, 0.955, 0.998)

    const primaryBase = primaryTerrainBaseRef.current
    if (primaryTerrainRef.current && primaryBase) {
      const attr = primaryTerrainRef.current.geometry.attributes
        .position as THREE.BufferAttribute
      const positions = attr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        const baseX = primaryBase[i]
        const baseY = primaryBase[i + 1]
        const horizon = smoothstep(-6, 18, baseY)

        const windRipple =
          Math.sin(baseX * 0.12 + elapsed * 0.18 + progress * 1.8) * 0.08

        const contourDrift =
          Math.cos(baseY * 0.14 - elapsed * 0.16 + baseX * 0.04) *
          0.06 *
          horizon

        positions[i + 2] =
          primaryBase[i + 2] + (windRipple + contourDrift) * motionFactor
      }

      attr.needsUpdate = true
      primaryTerrainRef.current.rotation.z =
        Math.sin(elapsed * 0.06) * 0.018 * motionFactor
    }

    const accentBase = accentTerrainBaseRef.current
    if (accentTerrainRef.current && accentBase) {
      const attr = accentTerrainRef.current.geometry.attributes
        .position as THREE.BufferAttribute
      const positions = attr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        const baseX = accentBase[i]
        const baseY = accentBase[i + 1]
        const horizon = smoothstep(-5, 14, baseY)

        const windRipple =
          Math.sin(baseX * 0.11 + elapsed * 0.15 + progress * 1.4) * 0.06

        const contourDrift =
          Math.cos(baseY * 0.13 - elapsed * 0.13 + baseX * 0.06) *
          0.05 *
          horizon

        positions[i + 2] =
          accentBase[i + 2] + (windRipple + contourDrift) * motionFactor
      }

      attr.needsUpdate = true
      accentTerrainRef.current.rotation.z =
        -Math.cos(elapsed * 0.06) * 0.012 * motionFactor
    }

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute
      const positions = attr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        const baseX = pointBase[i]
        const baseY = pointBase[i + 1]

        const pulse =
          (Math.sin(elapsed * 0.56 + baseX * 0.28 + progress * 6.2) * 0.18 +
            Math.cos(elapsed * 0.38 + baseY * 0.21 + progress * 4.6) * 0.12) *
          motionFactor

        positions[i + 2] = pointBase[i + 2] + pulse
      }

      attr.needsUpdate = true
      pointsRef.current.rotation.z =
        (progress - 0.5) * 0.36 + elapsed * 0.02 * motionFactor
      pointsRef.current.rotation.y =
        progress * 0.25 + elapsed * 0.03 * motionFactor
      pointsRef.current.position.y =
        Math.sin(elapsed * 0.25) * 0.1 * motionFactor
    }

    if (nearParticlesRef.current) {
      const attr = nearParticlesRef.current.geometry.attributes
        .position as THREE.BufferAttribute
      const positions = attr.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        const baseX = nearParticleBase[i]
        const baseY = nearParticleBase[i + 1]

        positions[i + 2] =
          nearParticleBase[i + 2] +
          (Math.sin(elapsed * 0.42 + baseX * 0.22 + progress * 3.4) * 0.08 +
            Math.cos(elapsed * 0.33 + baseY * 0.3) * 0.05) *
            motionFactor
      }

      attr.needsUpdate = true
      nearParticlesRef.current.rotation.y =
        -progress * 0.08 + elapsed * 0.01 * motionFactor
    }

    if (jellyfishRef.current) {
      const driftX =
        -0.86 +
        Math.sin(elapsed * 0.22) * 0.72 +
        Math.cos(elapsed * 0.09) * 0.24
      const driftY =
        2.86 + Math.sin(elapsed * 0.68) * 0.34 + Math.cos(elapsed * 0.37) * 0.16
      const driftZ = 0.82 + Math.cos(elapsed * 0.18) * 0.38

      jellyfishRef.current.position.x = THREE.MathUtils.damp(
        jellyfishRef.current.position.x,
        driftX,
        1.6,
        delta
      )
      jellyfishRef.current.position.y = THREE.MathUtils.damp(
        jellyfishRef.current.position.y,
        driftY,
        1.6,
        delta
      )
      jellyfishRef.current.position.z = THREE.MathUtils.damp(
        jellyfishRef.current.position.z,
        driftZ,
        1.6,
        delta
      )

      jellyfishRef.current.rotation.y += delta * 0.16
      jellyfishRef.current.rotation.z = Math.sin(elapsed * 0.24) * 0.12
    }

    if (roverRef.current) {
      const roverTargetX =
        0.42 + Math.sin(elapsed * 0.24) * 0.48 + Math.cos(elapsed * 0.12) * 0.14
      const roverTargetZ =
        1.48 + Math.cos(elapsed * 0.2) * 0.34 + Math.sin(elapsed * 0.11) * 0.12
      const roverTargetY = -1.08 + Math.sin(elapsed * 1.7) * 0.01

      roverRef.current.position.x = THREE.MathUtils.damp(
        roverRef.current.position.x,
        roverTargetX,
        1.9,
        delta
      )
      roverRef.current.position.y = THREE.MathUtils.damp(
        roverRef.current.position.y,
        roverTargetY,
        3.4,
        delta
      )
      roverRef.current.position.z = THREE.MathUtils.damp(
        roverRef.current.position.z,
        roverTargetZ,
        1.9,
        delta
      )

      const roverYaw = -0.28 + Math.sin(elapsed * 0.2) * 0.18
      roverRef.current.rotation.y = THREE.MathUtils.damp(
        roverRef.current.rotation.y,
        roverYaw,
        2.2,
        delta
      )
    }

    if (billboardRef.current) {
      const billboardTargetX = 3.52 + Math.sin(elapsed * 0.14) * 0.04
      const billboardTargetY = -1.08
      const billboardTargetZ = 1.36 + Math.cos(elapsed * 0.12) * 0.03
      const billboardYaw = -0.46 + Math.sin(elapsed * 0.1) * 0.02

      billboardRef.current.position.x = THREE.MathUtils.damp(
        billboardRef.current.position.x,
        billboardTargetX,
        2.2,
        delta
      )
      billboardRef.current.position.y = THREE.MathUtils.damp(
        billboardRef.current.position.y,
        billboardTargetY,
        2.2,
        delta
      )
      billboardRef.current.position.z = THREE.MathUtils.damp(
        billboardRef.current.position.z,
        billboardTargetZ,
        2.2,
        delta
      )

      billboardRef.current.rotation.x = THREE.MathUtils.damp(
        billboardRef.current.rotation.x,
        THREE.MathUtils.lerp(0.01, -0.02, billboardFocus),
        2.4,
        delta
      )
      billboardRef.current.rotation.y = THREE.MathUtils.damp(
        billboardRef.current.rotation.y,
        billboardYaw,
        2.2,
        delta
      )
      billboardRef.current.rotation.z = Math.sin(elapsed * 0.2) * 0.01
    }

    terrainBeaconRefs.current.forEach((beacon, index) => {
      if (!beacon) return

      const [baseX, baseY, baseZ, baseScale] = TERRAIN_BEACONS[index]
      const bob = Math.sin(elapsed * 0.86 + index * 0.7) * 0.04 * motionFactor

      beacon.position.x = baseX
      beacon.position.y = baseY + bob
      beacon.position.z = baseZ
      beacon.rotation.y += delta * (0.28 + index * 0.04) * motionFactor
      beacon.scale.setScalar(
        THREE.MathUtils.lerp(
          baseScale * 0.85,
          baseScale * 1.26,
          panelFocus * 0.35
        )
      )

      const material = terrainBeaconMaterialRefs.current[index]
      if (material) {
        material.opacity = THREE.MathUtils.lerp(0.26, 0.52, panelFocus)
      }
    })

    debrisRefs.current.forEach((debris, index) => {
      if (!debris) return

      const [, baseY] = TERRAIN_DEBRIS[index]
      const bob = Math.sin(elapsed * 0.72 + index * 0.58) * 0.024 * motionFactor
      const drift = Math.cos(elapsed * 0.36 + index * 0.44) * 0.016 * motionFactor

      debris.position.y = baseY + bob
      debris.rotation.y += delta * (0.18 + (index % 3) * 0.06) * motionFactor
      debris.rotation.z = drift
    })

    if (monitorGroupRef.current) {
      const targetX = THREE.MathUtils.lerp(4.8, 3.08, monitorCenterProgress)
      const targetY = THREE.MathUtils.lerp(2.58, -0.66, monitorCenterProgress)
      const targetZ = THREE.MathUtils.lerp(-1.4, 2.14, monitorCenterProgress)
      const targetScale = THREE.MathUtils.lerp(0.2, 0.38, monitorCenterProgress)

      monitorGroupRef.current.position.x = THREE.MathUtils.damp(
        monitorGroupRef.current.position.x,
        targetX,
        3,
        delta
      )

      monitorGroupRef.current.position.y = THREE.MathUtils.damp(
        monitorGroupRef.current.position.y,
        targetY,
        3,
        delta
      )
      monitorGroupRef.current.position.z = THREE.MathUtils.damp(
        monitorGroupRef.current.position.z,
        targetZ,
        3,
        delta
      )
      monitorGroupRef.current.rotation.x = THREE.MathUtils.damp(
        monitorGroupRef.current.rotation.x,
        THREE.MathUtils.lerp(0.02, 0.01, monitorCenterProgress),
        2.4,
        delta
      )
      monitorGroupRef.current.rotation.y = THREE.MathUtils.damp(
        monitorGroupRef.current.rotation.y,
        THREE.MathUtils.lerp(-0.44, -0.5, monitorCenterProgress) +
          Math.sin(elapsed * 0.2) * 0.006,
        2,
        delta
      )
      monitorGroupRef.current.rotation.z = THREE.MathUtils.damp(
        monitorGroupRef.current.rotation.z,
        0,
        2.4,
        delta
      )
      monitorGroupRef.current.scale.setScalar(
        THREE.MathUtils.damp(
          monitorGroupRef.current.scale.x,
          targetScale,
          3,
          delta
        )
      )
    }

    if (loaderProgressRef.current) {
      loaderProgressRef.current.scale.x = THREE.MathUtils.damp(
        loaderProgressRef.current.scale.x,
        loaderProgress,
        1.6,
        delta
      )
      loaderProgressRef.current.position.x =
        -1.9 + (3.8 * loaderProgressRef.current.scale.x) / 2
    }

    if (loaderOrbitRef.current) {
      loaderOrbitRef.current.rotation.z +=
        delta * (0.45 + loaderProgress * 0.85) * motionFactor
    }

    loaderWaveRefs.current.forEach((wave, index) => {
      if (!wave) return

      const pulse =
        0.58 + Math.abs(Math.sin(elapsed * 2.2 + index * 0.76)) * 0.96
      wave.scale.y = THREE.MathUtils.damp(wave.scale.y, pulse, 5, delta)

      const material = loaderWaveMaterialRefs.current[index]
      if (material) {
        material.opacity = THREE.MathUtils.clamp(0.18 + pulse * 0.34, 0, 0.8)
      }
    })

    if (loaderGroupRef.current) {
      const loaderFade = 1 - workflowReveal
      loaderGroupRef.current.visible = loaderFade > 0.04
      loaderGroupRef.current.scale.setScalar(1 - workflowReveal * 0.08)

      loaderMaterialRefs.current.forEach((material) => {
        if (!material) return
        material.opacity = THREE.MathUtils.clamp(
          0.05 + loaderFade * 0.68,
          0,
          0.74
        )
      })

      if (loaderLabelMaterialRef.current) {
        loaderLabelMaterialRef.current.opacity = THREE.MathUtils.clamp(
          0.08 + loaderFade * 0.88,
          0,
          0.96
        )
      }
    }

    if (workflowGroupRef.current) {
      workflowGroupRef.current.visible = workflowReveal > 0.01
      workflowGroupRef.current.scale.setScalar(0.72 + workflowReveal * 0.28)
      workflowGroupRef.current.position.y = -0.14 + workflowReveal * 0.16
    }

    if (workflowLineMaterialRef.current) {
      workflowLineMaterialRef.current.opacity = THREE.MathUtils.clamp(
        workflowReveal * 0.94,
        0,
        0.94
      )
    }

    workflowNodeRefs.current.forEach((node, index) => {
      if (!node) return

      const pulse = 0.86 + Math.sin(elapsed * 2 + index * 0.7) * 0.14
      node.scale.setScalar(THREE.MathUtils.lerp(0.6, pulse, workflowReveal))

      const material = workflowNodeMaterialRefs.current[index]
      if (material) {
        material.opacity = THREE.MathUtils.clamp(
          0.1 + workflowReveal * 0.9,
          0,
          1
        )
      }
    })

    if (workflowButtonFillRef.current) {
      workflowButtonFillRef.current.opacity = THREE.MathUtils.clamp(
        0.12 + workflowReveal * 0.24,
        0,
        0.36
      )
    }

    if (workflowButtonStrokeRef.current) {
      workflowButtonStrokeRef.current.opacity = THREE.MathUtils.clamp(
        workflowReveal * 0.92,
        0,
        0.92
      )
    }

    if (startLabelMaterialRef.current) {
      startLabelMaterialRef.current.opacity = THREE.MathUtils.clamp(
        workflowReveal * 0.98,
        0,
        0.98
      )
    }
  })

  return (
    <group position={[0, -0.58, 0.02]}>
      <mesh
        ref={primaryTerrainRef}
        position={[0, -0.78, -0.08]}
        rotation={[-Math.PI / 2.45, 0, 0]}
      >
        <planeGeometry args={[56, 40, 190, 140]} />
        <meshBasicMaterial
          color={palette.meshLine}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh
        ref={accentTerrainRef}
        position={[0, -0.64, -0.24]}
        rotation={[-Math.PI / 2.45, 0, 0]}
      >
        <planeGeometry args={[50, 34, 128, 96]} />
        <meshBasicMaterial
          color={palette.meshAccent}
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      <points
        ref={pointsRef}
        geometry={pointsGeometry}
        position={[0, 0.18, 0.74]}
      >
        <pointsMaterial
          color={palette.dotColor}
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </points>

      <points
        ref={nearParticlesRef}
        geometry={nearParticlesGeometry}
        position={[0, 0.02, 0.48]}
      >
        <pointsMaterial
          color={palette.meshAccent}
          size={0.064}
          sizeAttenuation
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </points>

      {TERRAIN_BEACONS.map((beacon, index) => (
        <mesh
          key={`terrain-beacon-${index}`}
          ref={(element) => {
            terrainBeaconRefs.current[index] = element
          }}
          position={[beacon[0], beacon[1], beacon[2]]}
        >
          <octahedronGeometry args={[beacon[3], 0]} />
          <meshBasicMaterial
            ref={(element) => {
              terrainBeaconMaterialRefs.current[index] = element
            }}
            color={palette.meshAccent}
            wireframe
            transparent
            opacity={0.32}
          />
        </mesh>
      ))}

      <group
        ref={jellyfishRef}
        position={[-0.86, 2.86, 0.82]}
        scale={jellyfishScale}
      >
        <primitive object={jellyfishGltf.scene} />
      </group>

      <group ref={roverRef} position={[0.42, -1.08, 1.48]} scale={roverScale}>
        <primitive object={roverGltf.scene} />
      </group>

      {TERRAIN_DEBRIS.map(([x, y, z, size, yaw], index) => (
        <group
          key={`terrain-debris-${index}`}
          ref={(element) => {
            debrisRefs.current[index] = element
          }}
          position={[x, y, z]}
          rotation={[0, yaw, 0]}
        >
          <mesh
            position={[0, size * 0.16, 0]}
            rotation={[
              Math.sin(index * 0.72) * 0.24,
              Math.cos(index * 0.52) * 0.24,
              Math.sin(index * 0.38) * 0.2
            ]}
          >
            {index % 3 === 0 ? (
              <dodecahedronGeometry args={[size, 0]} />
            ) : index % 3 === 1 ? (
              <octahedronGeometry args={[size * 0.92, 0]} />
            ) : (
              <boxGeometry args={[size * 1.3, size * 0.7, size * 0.95]} />
            )}
            <meshBasicMaterial
              color={index % 2 === 0 ? palette.meshLine : palette.meshAccent}
              wireframe
              transparent
              opacity={0.36}
            />
          </mesh>

          <mesh
            position={[size * 0.4, size * 0.04, -size * 0.24]}
            rotation={[Math.PI / 2, 0.2, index * 0.26]}
          >
            <cylinderGeometry
              args={[size * 0.08, size * 0.08, size * 1.18, 8]}
            />
            <meshBasicMaterial
              color={palette.meshAccent}
              wireframe
              transparent
              opacity={0.32}
            />
          </mesh>

          <mesh
            position={[-size * 0.34, size * 0.06, size * 0.32]}
            rotation={[0.24, index * 0.18, 0]}
          >
            <torusGeometry args={[size * 0.26, size * 0.028, 8, 18]} />
            <meshBasicMaterial
              color={palette.meshLine}
              wireframe
              transparent
              opacity={0.28}
            />
          </mesh>
        </group>
      ))}

      <group
        ref={billboardRef}
        position={[3.52, -1.08, 1.36]}
        rotation={[0.01, -0.46, 0]}
      >
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.72, 0.12, 0.46]} />
          <meshBasicMaterial
            color={palette.meshLine}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>

        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.11, 0.14, 2.46, 16]} />
          <meshBasicMaterial
            color={palette.meshAccent}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>

        <mesh position={[0.28, 1.18, -0.08]} rotation={[0.18, 0, 0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 2.02, 10]} />
          <meshBasicMaterial
            color={palette.meshLine}
            wireframe
            transparent
            opacity={0.42}
          />
        </mesh>

        <mesh position={[-0.28, 1.2, -0.08]} rotation={[0.16, 0, -0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 2.0, 10]} />
          <meshBasicMaterial
            color={palette.meshLine}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>

        <mesh position={[0, 2.56, -0.04]}>
          <boxGeometry args={[2, 1.22, 0.2]} />
          <meshBasicMaterial
            color={palette.meshLine}
            wireframe
            transparent
            opacity={0.52}
          />
        </mesh>

        <mesh position={[0, 2.08, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.03, 10, 24]} />
          <meshBasicMaterial
            color={palette.meshAccent}
            wireframe
            transparent
            opacity={0.34}
          />
        </mesh>
      </group>

      <group
        ref={monitorGroupRef}
        position={[4.8, 2.58, -1.4]}
        rotation={[0.02, -0.44, 0]}
        scale={0.2}
      >
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[7.8, 4.9, 0.68]} />
          <meshStandardMaterial
            color={palette.meshLine}
            metalness={0.28}
            roughness={0.56}
            transparent
            opacity={0.42}
          />
        </mesh>

        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[7.3, 4.45, 0.42]} />
          <meshBasicMaterial
            color={palette.meshAccent}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>

        <mesh position={[0, 0, 0.34]}>
          <planeGeometry args={[6.42, 3.82]} />
          <meshBasicMaterial
            color={palette.background}
            transparent
            opacity={0.98}
          />
        </mesh>

        <mesh position={[0, 0, 0.35]}>
          <planeGeometry args={[6.18, 3.58]} />
          <meshBasicMaterial
            color={palette.primary}
            transparent
            opacity={0.16}
          />
        </mesh>

        <group ref={loaderGroupRef} position={[0, 0, 0.38]}>
          {[
            [-2.56, 1.44, 1.12, 0.08],
            [-1.16, 1.44, 0.8, 0.08],
            [0.02, 1.44, 0.66, 0.08],
            [1.04, 1.44, 0.88, 0.08],
            [2.2, 1.44, 0.62, 0.08]
          ].map(([x, y, width, height], index) => (
            <mesh key={`loader-top-${index}`} position={[x, y, 0.01]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderMaterialRefs.current[index] = element
                }}
                color={palette.primary}
                transparent
                opacity={0.62}
              />
            </mesh>
          ))}

          <group ref={loaderOrbitRef} position={[0, 0.72, 0.01]}>
            <mesh>
              <ringGeometry args={[0.66, 0.98, 64]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderMaterialRefs.current[8] = element
                }}
                color={palette.primary}
                transparent
                opacity={0.58}
              />
            </mesh>

            <mesh position={[0, 0, 0.005]}>
              <ringGeometry args={[0.34, 0.5, 48]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderMaterialRefs.current[9] = element
                }}
                color={palette.meshAccent}
                transparent
                opacity={0.56}
              />
            </mesh>

            <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}>
              <ringGeometry args={[0.18, 0.28, 36, 1, 0, Math.PI * 1.38]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderMaterialRefs.current[10] = element
                }}
                color={palette.primary}
                transparent
                opacity={0.6}
              />
            </mesh>
          </group>

          {[
            [-2.32, -0.42, 1.24, 0.11],
            [-2.32, -0.66, 0.98, 0.1],
            [2.24, -0.42, 0.82, 0.11],
            [2.24, -0.66, 1.02, 0.1]
          ].map(([x, y, width, height], index) => (
            <mesh key={`loader-bars-${index}`} position={[x, y, 0.01]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderMaterialRefs.current[16 + index] = element
                }}
                color={palette.meshAccent}
                transparent
                opacity={0.56}
              />
            </mesh>
          ))}

          {[-0.9, -0.62, -0.34, -0.06, 0.22, 0.5, 0.78].map((x, index) => (
            <mesh
              key={`loader-wave-${index}`}
              ref={(element) => {
                loaderWaveRefs.current[index] = element
              }}
              position={[x, -0.98, 0.012]}
              scale={[1, 0.4, 1]}
            >
              <planeGeometry args={[0.12, 0.48]} />
              <meshBasicMaterial
                ref={(element) => {
                  loaderWaveMaterialRefs.current[index] = element
                }}
                color={palette.primary}
                transparent
                opacity={0.34}
              />
            </mesh>
          ))}

          <mesh position={[0, -1.4, 0.01]}>
            <planeGeometry args={[3.8, 0.22]} />
            <meshBasicMaterial
              ref={(element) => {
                loaderMaterialRefs.current[24] = element
              }}
              color={palette.meshLine}
              transparent
              opacity={0.2}
            />
          </mesh>

          <mesh
            ref={loaderProgressRef}
            position={[-1.84, -1.4, 0.02]}
            scale={[0.03, 1, 1]}
          >
            <planeGeometry args={[3.8, 0.18]} />
            <meshBasicMaterial
              ref={(element) => {
                loaderMaterialRefs.current[25] = element
              }}
              color={palette.primary}
              transparent
              opacity={0.72}
            />
          </mesh>

          {loadingLabelTexture && (
            <mesh position={[0, -1.1, 0.03]}>
              <planeGeometry args={[3.84, 0.38]} />
              <meshBasicMaterial
                ref={loaderLabelMaterialRef}
                map={loadingLabelTexture}
                transparent
                opacity={0.96}
              />
            </mesh>
          )}
        </group>

        <group ref={workflowGroupRef} position={[0, -0.06, 0.39]} scale={0.76}>
          <mesh position={[0, 1.34, 0.01]}>
            <planeGeometry args={[4.9, 0.15]} />
            <meshBasicMaterial
              color={palette.primary}
              transparent
              opacity={0.22}
            />
          </mesh>

          <lineSegments geometry={workflowLinesGeometry}>
            <lineBasicMaterial
              ref={workflowLineMaterialRef}
              color={palette.meshAccent}
              transparent
              opacity={0.01}
            />
          </lineSegments>

          {SCREEN_WORKFLOW_NODES.map((node, index) => (
            <mesh
              key={`workflow-node-${index}`}
              position={node}
              ref={(element) => {
                workflowNodeRefs.current[index] = element
              }}
            >
              <circleGeometry args={[0.09, 18]} />
              <meshBasicMaterial
                ref={(element) => {
                  workflowNodeMaterialRefs.current[index] = element
                }}
                color={palette.primary}
                transparent
                opacity={0.01}
              />
            </mesh>
          ))}

          <mesh position={[0, -1.38, 0.01]}>
            <planeGeometry args={[1.98, 0.46]} />
            <meshBasicMaterial
              ref={workflowButtonFillRef}
              color={palette.primary}
              transparent
              opacity={0.01}
            />
          </mesh>

          <mesh position={[0, -1.38, 0.02]}>
            <planeGeometry args={[2.04, 0.52]} />
            <meshBasicMaterial
              ref={workflowButtonStrokeRef}
              color={palette.meshAccent}
              wireframe
              transparent
              opacity={0.01}
            />
          </mesh>

          {startDemoLabelTexture && (
            <mesh position={[0, -1.38, 0.04]}>
              <planeGeometry args={[1.58, 0.3]} />
              <meshBasicMaterial
                ref={startLabelMaterialRef}
                map={startDemoLabelTexture}
                transparent
                opacity={0.01}
              />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(
  '/models/jellyfish.glb',
  undefined,
  undefined,
  patchBlobTextureUrls
)
useGLTF.preload('/models/rover.glb', undefined, undefined, patchBlobTextureUrls)
