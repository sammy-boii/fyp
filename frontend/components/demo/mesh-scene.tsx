'use client'

import { AdaptiveDpr } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState, type MutableRefObject } from 'react'
import { MeshNetwork, type MeshPalette } from './mesh-network'
import { ScrollReactiveRig } from './scroll-reactive-rig'

interface MeshSceneProps {
  palette: MeshPalette
  progressRef: MutableRefObject<number>
  reducedMotion: boolean
}

export function MeshScene({
  palette,
  progressRef,
  reducedMotion
}: MeshSceneProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.6])

  useEffect(() => {
    const updateDpr = () => {
      setDpr(window.innerWidth < 768 ? [1, 1.18] : [1, 1.65])
    }

    updateDpr()
    window.addEventListener('resize', updateDpr)

    return () => {
      window.removeEventListener('resize', updateDpr)
    }
  }, [])

  return (
    <div className='demo-mesh-canvas' aria-hidden='true'>
      <Canvas
        dpr={dpr}
        frameloop='always'
        camera={{ position: [0, 0.14, 9.4], fov: 45, near: 0.1, far: 80 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach='background' args={[palette.background]} />
        <fog attach='fog' args={[palette.fog, 4.5, 24]} />

        <ambientLight color={palette.lightSoft} intensity={0.3} />
        <pointLight
          position={[5, 3.5, 5.5]}
          color={palette.primary}
          intensity={1.72}
        />
        <pointLight
          position={[-6, -2.5, 4.2]}
          color={palette.secondary}
          intensity={0.84}
        />

        <directionalLight
          position={[0, 5, 5]}
          color={palette.meshAccent}
          intensity={0.32}
        />

        <AdaptiveDpr />

        <ScrollReactiveRig
          progressRef={progressRef}
          reducedMotion={reducedMotion}
        >
          <Suspense fallback={null}>
            <MeshNetwork
              palette={palette}
              progressRef={progressRef}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </ScrollReactiveRig>
      </Canvas>
    </div>
  )
}
