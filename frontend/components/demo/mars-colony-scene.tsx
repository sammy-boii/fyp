'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface MarsColonySceneProps {
  progressRef: MutableRefObject<number>
  reducedMotion: boolean
  onStartDemo?: () => void
}

const PALETTE = {
  background: 0x040a17,
  wireMain: 0x53f09b,
  wireSecondary: 0x6ff4b4,
  wireAccent: 0xa7ffe1,
  fillMain: 0x174734,
  fillSecondary: 0x1d5d43,
  fillAccent: 0x2a7d5c
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export function MarsColonyScene({
  progressRef,
  reducedMotion,
  onStartDemo
}: MarsColonySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(PALETTE.background)
    scene.fog = new THREE.FogExp2(PALETTE.background, 0.013)

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300)
    const colonyDepthOffset = -6.4
    const colonyTarget = new THREE.Vector3(-6.4, 2.2, 0.9 + colonyDepthOffset)
    const cameraTarget = colonyTarget.clone()
    const billboardFocusTarget = new THREE.Vector3(
      10.4,
      7.4,
      -1.2 + colonyDepthOffset
    )

    const updateCamera = (theta: number, phi: number, radius: number) => {
      camera.position.set(
        cameraTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        cameraTarget.y + radius * Math.cos(phi),
        cameraTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      camera.lookAt(cameraTarget)
    }

    const resize = () => {
      const parent = canvas.parentElement
      const width = parent?.clientWidth ?? window.innerWidth
      const height = parent?.clientHeight ?? window.innerHeight

      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    resize()
    window.addEventListener('resize', resize)

    const wmat = (color: number, opacity = 0.7) =>
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
        depthWrite: false
      })

    const smat = (color: number, opacity = 0.08) =>
      new THREE.MeshBasicMaterial({
        color,
        wireframe: false,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      })

    const lmat = (color: number, opacity = 0.9) =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false
      })

    const billboardHud = {
      bars: [] as THREE.Mesh[],
      chartLines: [] as THREE.Line[],
      spinner: null as THREE.Line | null,
      spinnerCore: null as THREE.Mesh | null,
      scanLine: null as THREE.Mesh | null,
      progressTrack: null as THREE.Mesh | null,
      progressFill: null as THREE.Mesh | null,
      progressTrackWidth: 0,
      screenHeight: 0,
      statusDots: [] as THREE.Mesh[],
      startButtonOutline: null as THREE.Line | null,
      startButtonFill: null as THREE.Mesh | null,
      startButtonGlow: null as THREE.Mesh | null,
      startButtonSheen: null as THREE.Mesh | null,
      startButtonLabel: null as THREE.Mesh | null,
      startButtonWidth: 0,
      textures: [] as THREE.Texture[]
    }

    const raycaster = new THREE.Raycaster()
    const pointerNdc = new THREE.Vector2(2, 2)
    let pointerInsideCanvas = false
    let startButtonHovered = false
    let startButtonPressed = false
    let startButtonReady = false
    let startButtonClickPulse = 0
    let startButtonHoverMix = 0
    let startButtonPressMix = 0
    let startButtonSheenSweep = 0

    // Terrain
    const terrainWidth = 140
    const terrainDepth = 140
    const terrainSegments = 110
    const terrainGeometry = new THREE.PlaneGeometry(
      terrainWidth,
      terrainDepth,
      terrainSegments,
      terrainSegments
    )
    terrainGeometry.rotateX(-Math.PI / 2)

    const terrainPositions = terrainGeometry.attributes.position

    const hill = (x: number, z: number) => {
      const nearFade = clamp((-z - 18) / 18, 0, 1)
      const midFade = clamp((-z - 32) / 24, 0, 1)
      const farFade = clamp((-z - 48) / 30, 0, 1)
      const midFadeSquared = midFade * midFade
      const farFadeSquared = farFade * farFade

      const nearHills =
        (Math.sin(x * 0.11 + 0.4) * Math.cos(z * 0.1 + 0.2) * 2.2 +
          Math.sin(x * 0.19 + 1.1) * Math.cos(z * 0.16 + 0.8) * 1.7) *
        nearFade *
        0.94

      const midHills =
        (Math.sin(x * 0.14 + 0.5) * Math.cos(z * 0.12) * 3.8 +
          Math.sin(x * 0.27 + 1.1) * Math.cos(z * 0.22 + 0.9) * 2.2 +
          Math.sin(x * 0.4 + 0.9) * Math.cos(z * 0.3 + 0.1) * 1.3) *
        midFadeSquared

      const farHills =
        (Math.sin(x * 0.09 + 0.6) * Math.cos(z * 0.07 + 0.6) * 5.6 +
          Math.sin(x * 0.2 + 2.1) * Math.cos(z * 0.1 + 1.2) * 2.8 +
          Math.sin(x * 0.33 + 0.7) * Math.cos(z * 0.18 + 0.4) * 2 +
          Math.sin(x * 0.53 + 1.4) * Math.cos(z * 0.26 + 0.2) * 0.95) *
        farFadeSquared

      const macro = nearHills + midHills + farHills
      const softenedValleys = macro < 0 ? macro * 0.2 : macro
      const frontTexture =
        Math.sin(x * 0.28 + 0.2) * Math.cos(z * 0.24 + 0.3) * 0.02

      return softenedValleys + frontTexture
    }

    for (let index = 0; index < terrainPositions.count; index += 1) {
      const x = terrainPositions.getX(index)
      const z = terrainPositions.getZ(index)
      terrainPositions.setY(index, hill(x, z))
    }
    terrainGeometry.computeVertexNormals()

    const terrainWire = new THREE.Mesh(
      terrainGeometry,
      wmat(PALETTE.wireMain, 0.58)
    )
    scene.add(terrainWire)

    const terrainFill = new THREE.Mesh(
      terrainGeometry,
      smat(PALETTE.fillMain, 0.08)
    )
    scene.add(terrainFill)

    const groundY = (x: number, z: number) => hill(x, z)
    const structureScale = 2

    // Structures
    const addDome = (x: number, z: number, radius: number, color: number) => {
      const worldZ = z + colonyDepthOffset
      const y = groundY(x, worldZ)
      const scaledRadius = radius * structureScale
      const geometry = new THREE.SphereGeometry(
        scaledRadius,
        20,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      )

      const fill = new THREE.Mesh(geometry, smat(color, 0.08))
      fill.position.set(x, y, worldZ)
      scene.add(fill)

      const wire = new THREE.Mesh(geometry, wmat(color, 0.76))
      wire.position.set(x, y, worldZ)
      scene.add(wire)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(scaledRadius, 0.06 * structureScale, 6, 36),
        wmat(color, 0.88)
      )
      ring.rotation.x = Math.PI / 2
      ring.position.set(x, y + 0.05, worldZ)
      scene.add(ring)
    }

    const addTube = (
      x: number,
      z: number,
      radius: number,
      length: number,
      rotY: number,
      color: number
    ) => {
      const worldZ = z + colonyDepthOffset
      const y = groundY(x, worldZ)
      const scaledRadius = radius * structureScale
      const scaledLength = length * structureScale
      const geometry = new THREE.CylinderGeometry(
        scaledRadius,
        scaledRadius,
        scaledLength,
        18,
        6,
        true
      )

      const fill = new THREE.Mesh(geometry, smat(color, 0.08))
      fill.position.set(x, y + scaledLength / 2, worldZ)
      fill.rotation.y = rotY
      scene.add(fill)

      const wire = new THREE.Mesh(geometry, wmat(color, 0.76))
      wire.position.set(x, y + scaledLength / 2, worldZ)
      wire.rotation.y = rotY
      scene.add(wire)

      for (let side = 0; side < 2; side += 1) {
        const cap = new THREE.Mesh(
          new THREE.CircleGeometry(scaledRadius, 18),
          wmat(color, 0.62)
        )
        cap.rotation.x = side === 0 ? Math.PI / 2 : -Math.PI / 2
        cap.position.set(x, y + (side === 0 ? 0 : scaledLength), worldZ)
        scene.add(cap)
      }

      const endDome = new THREE.Mesh(
        new THREE.SphereGeometry(
          scaledRadius,
          14,
          8,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2
        ),
        wmat(color, 0.62)
      )
      endDome.rotation.x = Math.PI
      endDome.position.set(x, y, worldZ)
      scene.add(endDome)
    }

    const addGiantBillboard = (x: number, z: number, color: number) => {
      const worldZ = z + colonyDepthOffset
      const y = groundY(x, worldZ)
      const boardWidth = 16
      const boardHeight = 9
      const boardBaseY = y + 11.8
      const supportBaseY = y + 0.02
      const poleHeight = boardBaseY - supportBaseY
      const poleOffset = boardWidth * 0.44

      ;[-poleOffset, poleOffset].forEach((offsetX) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, poleHeight, 10),
          wmat(color, 0.92)
        )
        pole.position.set(x + offsetX, supportBaseY + poleHeight / 2, worldZ)
        scene.add(pole)
      })

      const frameCorners = [
        new THREE.Vector3(x - boardWidth / 2, boardBaseY, worldZ),
        new THREE.Vector3(x + boardWidth / 2, boardBaseY, worldZ),
        new THREE.Vector3(x + boardWidth / 2, boardBaseY + boardHeight, worldZ),
        new THREE.Vector3(x - boardWidth / 2, boardBaseY + boardHeight, worldZ),
        new THREE.Vector3(x - boardWidth / 2, boardBaseY, worldZ)
      ]
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(frameCorners),
          lmat(color, 0.95)
        )
      )

      const boardFill = new THREE.Mesh(
        new THREE.PlaneGeometry(boardWidth * 0.78, boardHeight * 0.72),
        smat(color, 0.14)
      )
      boardFill.position.set(x, boardBaseY + boardHeight / 2, worldZ - 0.04)
      scene.add(boardFill)

      for (let i = 1; i < 6; i += 1) {
        const lineX = x - boardWidth / 2 + i * (boardWidth / 6)
        const verticalLine = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(lineX, boardBaseY, worldZ),
          new THREE.Vector3(lineX, boardBaseY + boardHeight, worldZ)
        ])
        scene.add(new THREE.Line(verticalLine, lmat(color, 0.35)))
      }

      for (let i = 1; i < 4; i += 1) {
        const lineY = boardBaseY + i * (boardHeight / 4)
        const horizontalLine = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - boardWidth / 2, lineY, worldZ),
          new THREE.Vector3(x + boardWidth / 2, lineY, worldZ)
        ])
        scene.add(new THREE.Line(horizontalLine, lmat(color, 0.35)))
      }

      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x - boardWidth / 2, boardBaseY, worldZ),
            new THREE.Vector3(
              x + boardWidth / 2,
              boardBaseY + boardHeight,
              worldZ
            )
          ]),
          lmat(color, 0.28)
        )
      )
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x + boardWidth / 2, boardBaseY, worldZ),
            new THREE.Vector3(
              x - boardWidth / 2,
              boardBaseY + boardHeight,
              worldZ
            )
          ]),
          lmat(color, 0.28)
        )
      )

      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x - poleOffset, boardBaseY, worldZ),
            new THREE.Vector3(x - boardWidth / 2, boardBaseY, worldZ)
          ]),
          lmat(color, 0.62)
        )
      )
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x + poleOffset, boardBaseY, worldZ),
            new THREE.Vector3(x + boardWidth / 2, boardBaseY, worldZ)
          ]),
          lmat(color, 0.62)
        )
      )
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x - poleOffset, boardBaseY, worldZ),
            new THREE.Vector3(x + poleOffset, boardBaseY, worldZ)
          ]),
          lmat(color, 0.44)
        )
      )

      const screenWidth = boardWidth * 0.66
      const screenHeight = boardHeight * 0.56

      billboardHud.screenHeight = screenHeight

      billboardHud.screenHeight = screenHeight

      const screenGroup = new THREE.Group()
      screenGroup.position.set(x, boardBaseY + boardHeight / 2, worldZ - 0.08)
      scene.add(screenGroup)

      const addScreenLine = (
        points: THREE.Vector3[],
        opacity = 0.48,
        lineColor = PALETTE.wireAccent
      ) => {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          lmat(lineColor, opacity)
        )
        screenGroup.add(line)
        return line
      }

      // ── Background fill ──
      const bgFill = new THREE.Mesh(
        new THREE.PlaneGeometry(screenWidth * 0.98, screenHeight * 0.98),
        smat(PALETTE.fillMain, 0.18)
      )
      bgFill.position.z = -0.01
      screenGroup.add(bgFill)

      // ── Fine grid ──
      for (let i = -7; i <= 7; i++) {
        const gx = (i / 7) * (screenWidth * 0.47)
        addScreenLine(
          [
            new THREE.Vector3(gx, -screenHeight * 0.46, 0),
            new THREE.Vector3(gx, screenHeight * 0.46, 0)
          ],
          0.09,
          PALETTE.wireMain
        )
      }
      for (let i = -4; i <= 4; i++) {
        const gy = (i / 4) * (screenHeight * 0.46)
        addScreenLine(
          [
            new THREE.Vector3(-screenWidth * 0.48, gy, 0),
            new THREE.Vector3(screenWidth * 0.48, gy, 0)
          ],
          0.09,
          PALETTE.wireMain
        )
      }

      // ── Corner brackets ──
      const bL = screenWidth * 0.46
      const bH = screenHeight * 0.44
      const bS = screenWidth * 0.09 // bracket arm length
      const corners = [
        { sx: -1, sy: 1 },
        { sx: 1, sy: 1 },
        { sx: -1, sy: -1 },
        { sx: 1, sy: -1 }
      ]
      corners.forEach(({ sx, sy }) => {
        addScreenLine(
          [
            new THREE.Vector3(sx * bL, sy * bH - sy * bS * 0.7, 0),
            new THREE.Vector3(sx * bL, sy * bH, 0),
            new THREE.Vector3(sx * bL - sx * bS, sy * bH, 0)
          ],
          0.82,
          PALETTE.wireAccent
        )
      })

      // ── Spinner with pulsing ring ──
      const spinnerCurve = new THREE.EllipseCurve(
        0,
        0,
        screenHeight * 0.16,
        screenHeight * 0.16,
        0,
        Math.PI * 1.72,
        false,
        0
      )
      const spinnerPoints = spinnerCurve
        .getPoints(64)
        .map((p) => new THREE.Vector3(p.x, p.y, 0))
      const spinner = addScreenLine(spinnerPoints, 0.9, PALETTE.wireAccent)
      spinner.position.set(-screenWidth * 0.29, screenHeight * 0.1, 0.02)
      billboardHud.spinner = spinner

      // Outer ring (static, dim)
      const outerRingCurve = new THREE.EllipseCurve(
        0,
        0,
        screenHeight * 0.21,
        screenHeight * 0.21,
        0,
        Math.PI * 2,
        false,
        0
      )
      const outerRingLine = addScreenLine(
        outerRingCurve.getPoints(48).map((p) => new THREE.Vector3(p.x, p.y, 0)),
        0.18,
        PALETTE.wireMain
      )
      outerRingLine.position.set(-screenWidth * 0.29, screenHeight * 0.1, 0.015)

      const spinnerCore = new THREE.Mesh(
        new THREE.CircleGeometry(screenHeight * 0.036, 20),
        smat(PALETTE.wireAccent, 0.35)
      )
      spinnerCore.position.set(-screenWidth * 0.29, screenHeight * 0.1, 0.025)
      screenGroup.add(spinnerCore)
      billboardHud.spinnerCore = spinnerCore

      // ── Chart lines ──
      const chartOriginX = -screenWidth * 0.04
      const chartPointsA = [
        new THREE.Vector3(chartOriginX - screenWidth * 0.22, 0.02, 0.02),
        new THREE.Vector3(
          chartOriginX - screenWidth * 0.15,
          screenHeight * 0.09,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX - screenWidth * 0.1,
          -screenHeight * 0.03,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX - screenWidth * 0.02,
          screenHeight * 0.13,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.06,
          screenHeight * 0.05,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.14,
          screenHeight * 0.21,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.23,
          screenHeight * 0.15,
          0.02
        )
      ]
      const chartA = addScreenLine(chartPointsA, 0.82, PALETTE.wireSecondary)
      chartA.position.y = screenHeight * 0.2
      billboardHud.chartLines.push(chartA)

      const chartPointsB = [
        new THREE.Vector3(
          chartOriginX - screenWidth * 0.22,
          -screenHeight * 0.07,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX - screenWidth * 0.16,
          screenHeight * 0.02,
          0.02
        ),
        new THREE.Vector3(chartOriginX - screenWidth * 0.08, 0, 0.02),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.02,
          screenHeight * 0.1,
          0.02
        ),
        new THREE.Vector3(chartOriginX + screenWidth * 0.1, 0, 0.02),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.18,
          screenHeight * 0.07,
          0.02
        ),
        new THREE.Vector3(
          chartOriginX + screenWidth * 0.24,
          screenHeight * 0.02,
          0.02
        )
      ]
      const chartB = addScreenLine(chartPointsB, 0.64, PALETTE.wireMain)
      chartB.position.y = screenHeight * 0.07
      billboardHud.chartLines.push(chartB)

      // Axis baseline for charts
      addScreenLine(
        [
          new THREE.Vector3(
            chartOriginX - screenWidth * 0.23,
            screenHeight * 0.065,
            0.01
          ),
          new THREE.Vector3(
            chartOriginX + screenWidth * 0.25,
            screenHeight * 0.065,
            0.01
          )
        ],
        0.28,
        PALETTE.wireAccent
      )

      // ── Animated bars ──
      const barWidth = screenWidth * 0.048
      const barBaseHeight = screenHeight * 0.22
      const barBottom = -screenHeight * 0.28
      const barStartX = screenWidth * 0.165
      for (let i = 0; i < 5; i++) {
        const bar = new THREE.Mesh(
          new THREE.PlaneGeometry(barWidth, barBaseHeight),
          smat(PALETTE.wireSecondary, 0.3)
        )
        const barX = barStartX + i * barWidth * 1.6
        bar.scale.y = 0.34
        bar.position.set(
          barX,
          barBottom + (barBaseHeight * bar.scale.y) / 2,
          0.03
        )
        bar.userData = {
          bottom: barBottom,
          baseHeight: barBaseHeight,
          phase: i * 0.72
        }
        screenGroup.add(bar)
        billboardHud.bars.push(bar)

        // Bar outline
        addScreenLine(
          [
            new THREE.Vector3(barX - barWidth / 2, barBottom, 0.035),
            new THREE.Vector3(barX + barWidth / 2, barBottom, 0.035)
          ],
          0.3,
          PALETTE.wireAccent
        )
      }
      // Bars axis
      addScreenLine(
        [
          new THREE.Vector3(barStartX - barWidth, barBottom, 0.02),
          new THREE.Vector3(barStartX + barWidth * 9, barBottom, 0.02)
        ],
        0.5,
        PALETTE.wireAccent
      )

      // ── Progress bar ──
      const progressTrackWidth = screenWidth * 0.88
      const progressTrackHeight = screenHeight * 0.052
      const progressTrackY = -screenHeight * 0.395
      // Track outline
      addScreenLine(
        [
          new THREE.Vector3(
            -progressTrackWidth / 2,
            progressTrackY - progressTrackHeight / 2,
            0.015
          ),
          new THREE.Vector3(
            progressTrackWidth / 2,
            progressTrackY - progressTrackHeight / 2,
            0.015
          ),
          new THREE.Vector3(
            progressTrackWidth / 2,
            progressTrackY + progressTrackHeight / 2,
            0.015
          ),
          new THREE.Vector3(
            -progressTrackWidth / 2,
            progressTrackY + progressTrackHeight / 2,
            0.015
          ),
          new THREE.Vector3(
            -progressTrackWidth / 2,
            progressTrackY - progressTrackHeight / 2,
            0.015
          )
        ],
        0.42,
        PALETTE.wireAccent
      )
      const progressTrack = new THREE.Mesh(
        new THREE.PlaneGeometry(progressTrackWidth, progressTrackHeight),
        smat(PALETTE.wireMain, 0.1)
      )
      progressTrack.position.set(0, progressTrackY, 0.02)
      screenGroup.add(progressTrack)
      billboardHud.progressTrack = progressTrack

      const progressFill = new THREE.Mesh(
        new THREE.PlaneGeometry(progressTrackWidth, progressTrackHeight),
        smat(PALETTE.wireAccent, 0.42)
      )
      progressFill.scale.x = 0.08
      progressFill.position.set(
        -progressTrackWidth / 2 +
          (progressTrackWidth * progressFill.scale.x) / 2,
        progressTrackY,
        0.03
      )
      screenGroup.add(progressFill)
      billboardHud.progressFill = progressFill
      billboardHud.progressTrackWidth = progressTrackWidth

      // ── Scan line ──
      const scanLine = new THREE.Mesh(
        new THREE.PlaneGeometry(screenWidth * 0.92, screenHeight * 0.032),
        smat(PALETTE.wireAccent, 0.22)
      )
      scanLine.position.set(0, -screenHeight * 0.2, 0.025)
      screenGroup.add(scanLine)
      billboardHud.scanLine = scanLine

      // ── Status dots (top-left) ──
      for (let i = 0; i < 3; i++) {
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(screenHeight * 0.028, 16),
          smat(PALETTE.wireAccent, 0.24)
        )
        dot.position.set(
          -screenWidth * 0.41 + i * screenHeight * 0.13,
          screenHeight * 0.375,
          0.03
        )
        screenGroup.add(dot)
        billboardHud.statusDots.push(dot)
      }
      // Status line label area
      addScreenLine(
        [
          new THREE.Vector3(-screenWidth * 0.28, screenHeight * 0.375, 0.03),
          new THREE.Vector3(screenWidth * 0.38, screenHeight * 0.375, 0.03)
        ],
        0.18,
        PALETTE.wireMain
      )
      addScreenLine(
        [
          new THREE.Vector3(
            -screenWidth * 0.28,
            screenHeight * 0.375 - screenHeight * 0.04,
            0.03
          ),
          new THREE.Vector3(
            screenWidth * 0.18,
            screenHeight * 0.375 - screenHeight * 0.04,
            0.03
          )
        ],
        0.12,
        PALETTE.wireMain
      )

      // ── START DEMO button ──
      const buttonWidth = screenWidth * 0.34
      const buttonHeight = screenHeight * 0.13
      const buttonY = 0
      billboardHud.startButtonWidth = buttonWidth

      // Glow halo
      const buttonGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(buttonWidth * 1.5, buttonHeight * 2.2),
        smat(PALETTE.wireMain, 0)
      )
      buttonGlow.position.set(0, buttonY, 0.032)
      screenGroup.add(buttonGlow)
      billboardHud.startButtonGlow = buttonGlow

      // Fill
      const buttonFill = new THREE.Mesh(
        new THREE.PlaneGeometry(buttonWidth, buttonHeight),
        smat(PALETTE.fillSecondary, 0)
      )
      buttonFill.position.set(0, buttonY, 0.04)
      screenGroup.add(buttonFill)
      billboardHud.startButtonFill = buttonFill

      // Outline
      const buttonOutlinePoints = [
        new THREE.Vector3(-buttonWidth / 2, -buttonHeight / 2, 0),
        new THREE.Vector3(buttonWidth / 2, -buttonHeight / 2, 0),
        new THREE.Vector3(buttonWidth / 2, buttonHeight / 2, 0),
        new THREE.Vector3(-buttonWidth / 2, buttonHeight / 2, 0),
        new THREE.Vector3(-buttonWidth / 2, -buttonHeight / 2, 0)
      ]
      const buttonOutline = addScreenLine(
        buttonOutlinePoints,
        0,
        PALETTE.wireAccent
      )
      buttonOutline.position.set(0, buttonY, 0.045)
      billboardHud.startButtonOutline = buttonOutline

      // Corner accent ticks on button
      const tickLen = buttonWidth * 0.08
      ;[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ].forEach(([cx, cy]) => {
        addScreenLine(
          [
            new THREE.Vector3(
              cx * (buttonWidth / 2 + tickLen * 0.5),
              (cy * buttonHeight) / 2,
              0
            ),
            new THREE.Vector3(
              cx * (buttonWidth / 2 - tickLen * 0.5),
              (cy * buttonHeight) / 2,
              0
            )
          ],
          0,
          PALETTE.wireAccent
        ).position.set(0, buttonY, 0.047)
      })

      // Reflection sheen — narrow diagonal strip
      const buttonSheen = new THREE.Mesh(
        new THREE.PlaneGeometry(buttonWidth * 0.14, buttonHeight * 1.1),
        smat(PALETTE.wireAccent, 0)
      )
      buttonSheen.position.set(-buttonWidth * 0.38, buttonY, 0.048)
      buttonSheen.rotation.z = -0.22
      screenGroup.add(buttonSheen)
      billboardHud.startButtonSheen = buttonSheen

      // Label canvas
      const buttonCanvas = document.createElement('canvas')
      buttonCanvas.width = 1024
      buttonCanvas.height = 256
      const buttonContext = buttonCanvas.getContext('2d')
      if (buttonContext) {
        buttonContext.clearRect(0, 0, buttonCanvas.width, buttonCanvas.height)
        // Text glow layers
        buttonContext.textAlign = 'center'
        buttonContext.textBaseline = 'middle'
        const cx = buttonCanvas.width / 2
        const cy = buttonCanvas.height / 2
        // Outer glow
        buttonContext.save()
        buttonContext.globalAlpha = 0.22
        buttonContext.shadowColor = '#53f09b'
        buttonContext.shadowBlur = 48
        buttonContext.fillStyle = '#a7ffe1'
        buttonContext.font = '700 112px "Segoe UI", system-ui, sans-serif'
        buttonContext.fillText('START DEMO', cx, cy)
        buttonContext.restore()
        // Inner crisp text
        const gradient = buttonContext.createLinearGradient(
          0,
          0,
          buttonCanvas.width,
          0
        )
        gradient.addColorStop(0, '#87ffd1')
        gradient.addColorStop(0.4, '#ffffff')
        gradient.addColorStop(0.6, '#d9ffee')
        gradient.addColorStop(1, '#9fffd8')
        buttonContext.fillStyle = gradient
        buttonContext.shadowColor = 'rgba(83,240,155,0.9)'
        buttonContext.shadowBlur = 18
        buttonContext.font = '700 112px "Segoe UI", system-ui, sans-serif'
        buttonContext.fillText('START DEMO', cx, cy)
        // Thin highlight stripe across top-third of text
        const shine = buttonContext.createLinearGradient(0, cy - 56, 0, cy - 10)
        shine.addColorStop(0, 'rgba(255,255,255,0.28)')
        shine.addColorStop(1, 'rgba(255,255,255,0)')
        buttonContext.fillStyle = shine
        buttonContext.fillRect(0, cy - 60, buttonCanvas.width, 54)
      }
      const buttonTexture = new THREE.CanvasTexture(buttonCanvas)
      buttonTexture.colorSpace = THREE.SRGBColorSpace
      buttonTexture.needsUpdate = true
      billboardHud.textures.push(buttonTexture)

      const buttonLabelMaterial = new THREE.MeshBasicMaterial({
        map: buttonTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
      const buttonLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(buttonWidth * 0.86, buttonHeight * 0.62),
        buttonLabelMaterial
      )
      buttonLabel.position.set(0, buttonY, 0.05)
      screenGroup.add(buttonLabel)
      billboardHud.startButtonLabel = buttonLabel

      return new THREE.Vector3(x, boardBaseY + boardHeight * 0.5, worldZ - 0.03)
    }

    const addSolar = (x: number, z: number, color: number) => {
      const worldZ = z + colonyDepthOffset
      const y = groundY(x, worldZ)
      const poleGeometry = new THREE.CylinderGeometry(
        0.04 * structureScale,
        0.04 * structureScale,
        1.2 * structureScale,
        5
      )

      const poleBase = new THREE.Mesh(poleGeometry, wmat(color, 0.8))
      poleBase.position.set(x, y + 0.3 * structureScale, worldZ)
      scene.add(poleBase)

      const pole = new THREE.Mesh(poleGeometry, wmat(color, 0.8))
      pole.position.set(x, y + 0.9 * structureScale, worldZ)
      scene.add(pole)

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1 * structureScale, 0.55 * structureScale),
        wmat(color, 0.72)
      )
      panel.rotation.x = -0.3
      panel.position.set(x, y + 1.35 * structureScale, worldZ)
      scene.add(panel)
    }

    const colorMain = PALETTE.wireMain
    const colorSecondary = PALETTE.wireSecondary
    const colorAccent = PALETTE.wireAccent
    const layoutSpread = 1.34
    const sx = (value: number) => value * layoutSpread
    const sz = (value: number) => value * layoutSpread

    addDome(sx(0), sz(-2), 4.2, colorMain)
    addDome(sx(-8.4), sz(-1.6), 1.85, colorSecondary)
    addDome(sx(8.4), sz(-1.6), 1.85, colorSecondary)
    addTube(sx(-7), sz(-2), 1.15, 4.8, 0, colorSecondary)
    addTube(sx(7), sz(-2), 1.05, 4.5, 0, colorSecondary)

    const giantBillboardFocus = addGiantBillboard(12.0, -1.2, colorSecondary)
    billboardFocusTarget.copy(giantBillboardFocus)

    addSolar(sx(-18), sz(3.4), colorAccent)
    addSolar(sx(18), sz(2.9), colorAccent)

    // Sky backdrop
    const starCount = 6200
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i += 1) {
      const index = i * 3
      starPositions[index] = (Math.random() - 0.5) * 180
      starPositions[index + 1] = 8 + Math.random() * 40
      starPositions[index + 2] = -145 + Math.random() * 170
    }
    const starsGeometry = new THREE.BufferGeometry()
    starsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    )
    const starsMaterial = new THREE.PointsMaterial({
      color: PALETTE.wireAccent,
      size: 0.15,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.44,
      depthWrite: false
    })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    const deepStarCount = 8200
    const deepStarPositions = new Float32Array(deepStarCount * 3)
    for (let i = 0; i < deepStarCount; i += 1) {
      const index = i * 3
      deepStarPositions[index] = (Math.random() - 0.5) * 280
      deepStarPositions[index + 1] = 26 + Math.random() * 70
      deepStarPositions[index + 2] = -250 + Math.random() * 130
    }
    const deepStarsGeometry = new THREE.BufferGeometry()
    deepStarsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(deepStarPositions, 3)
    )
    const deepStarsMaterial = new THREE.PointsMaterial({
      color: PALETTE.wireMain,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    })

    const coreStarCount = 1300
    const coreStarPositions = new Float32Array(coreStarCount * 3)
    for (let i = 0; i < coreStarCount; i++) {
      const idx = i * 3
      coreStarPositions[idx] = (Math.random() - 0.5) * 120
      coreStarPositions[idx + 1] = 14 + Math.random() * 30
      coreStarPositions[idx + 2] = -180 + Math.random() * 80
    }
    const coreStarsGeometry = new THREE.BufferGeometry()
    coreStarsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(coreStarPositions, 3)
    )
    const coreStarsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.19,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
    const coreStars = new THREE.Points(coreStarsGeometry, coreStarsMaterial)
    scene.add(coreStars)

    const deepStars = new THREE.Points(deepStarsGeometry, deepStarsMaterial)
    scene.add(deepStars)

    const skyParticleCount = 3400
    const skyParticlePositions = new Float32Array(skyParticleCount * 3)
    for (let i = 0; i < skyParticleCount; i += 1) {
      const index = i * 3
      skyParticlePositions[index] = (Math.random() - 0.5) * 220
      skyParticlePositions[index + 1] = 10 + Math.random() * 58
      skyParticlePositions[index + 2] = -220 + Math.random() * 190
    }
    const skyParticlesGeometry = new THREE.BufferGeometry()
    skyParticlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(skyParticlePositions, 3)
    )
    const skyParticlesMaterial = new THREE.PointsMaterial({
      color: PALETTE.wireSecondary,
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    })
    const skyParticles = new THREE.Points(
      skyParticlesGeometry,
      skyParticlesMaterial
    )
    scene.add(skyParticles)

    type ShootingStar = {
      line: THREE.Line
      head: THREE.Vector3
      velocity: THREE.Vector3
      length: number
    }
    const shootingStars: ShootingStar[] = []

    const resetShootingStar = (
      star: ShootingStar,
      randomizeVelocity = false
    ) => {
      star.head.set(
        65 + Math.random() * 85,
        20 + Math.random() * 26,
        -130 + Math.random() * 70
      )
      if (randomizeVelocity) {
        star.velocity.set(
          -0.82 - Math.random() * 0.5,
          -0.15 - Math.random() * 0.08,
          0.38 + Math.random() * 0.3
        )
      }

      const direction = star.velocity.clone().normalize()
      const tail = star.head.clone().addScaledVector(direction, -star.length)
      const positions = star.line.geometry.attributes
        .position as THREE.BufferAttribute
      positions.setXYZ(0, star.head.x, star.head.y, star.head.z)
      positions.setXYZ(1, tail.x, tail.y, tail.z)
      positions.needsUpdate = true
    }

    const shootingStarCount = 48
    for (let i = 0; i < shootingStarCount; i += 1) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(6), 3)
      )
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: PALETTE.wireAccent,
          transparent: true,
          opacity: 0.38,
          depthWrite: false
        })
      )
      const shootingStar: ShootingStar = {
        line,
        head: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        length: 4 + Math.random() * 3.6
      }
      resetShootingStar(shootingStar, true)
      scene.add(line)
      shootingStars.push(shootingStar)
    }

    let isDisposed = false
    let jellyfish: THREE.Object3D | null = null
    let jellyfishMixer: THREE.AnimationMixer | null = null
    const jellyfishBaseScale = 9
    const toJellyWireMaterial = () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.wireAccent,
        wireframe: true,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    const toJellyEdgeMaterial = () =>
      new THREE.LineBasicMaterial({
        color: PALETTE.wireAccent,
        transparent: true,
        opacity: 0.84,
        depthWrite: false
      })
    const jellyfishLoader = new GLTFLoader()
    jellyfishLoader.load(
      '/models/jellyfish.glb',
      (gltf) => {
        if (isDisposed) {
          gltf.scene.traverse((object) => {
            const mesh = object as THREE.Mesh
            if (mesh.geometry) {
              mesh.geometry.dispose()
            }
            const material = mesh.material
            if (Array.isArray(material)) {
              material.forEach((item) => item.dispose())
            } else if (material) {
              material.dispose()
            }
          })
          return
        }

        const model = gltf.scene
        // Replace the model.traverse(...) block with this:
        const meshesToStyle: THREE.Mesh[] = []
        model.traverse((object) => {
          const mesh = object as THREE.Mesh & { isMesh?: boolean }
          if (mesh.isMesh) meshesToStyle.push(mesh)
        })

        meshesToStyle.forEach((mesh) => {
          const prev = mesh.material
          ;(Array.isArray(prev) ? prev : [prev]).forEach((m) => m?.dispose())

          // Translucent fill
          mesh.material = new THREE.MeshBasicMaterial({
            color: PALETTE.fillAccent,
            transparent: true,
            opacity: 0.004,
            side: THREE.DoubleSide,
            depthWrite: false
          })
          mesh.renderOrder = 1
          mesh.frustumCulled = false

          // Dim full wireframe
          const wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({
              color: PALETTE.wireMain,
              transparent: true,
              opacity: 0.06,
              depthWrite: false
            })
          )
          wire.renderOrder = 2
          wire.frustumCulled = false
          mesh.add(wire)

          // Sharp structural edges only
          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry, 18),
            new THREE.LineBasicMaterial({
              color: PALETTE.wireAccent,
              transparent: true,
              opacity: 0.225,
              depthWrite: false
            })
          )
          edges.renderOrder = 3
          edges.frustumCulled = false
          mesh.add(edges)

          // Backside glow hull
          const glow = new THREE.Mesh(
            mesh.geometry,
            new THREE.MeshBasicMaterial({
              color: PALETTE.wireAccent,
              transparent: true,
              opacity: 0.003,
              side: THREE.BackSide,
              depthWrite: false
            })
          )
          glow.scale.setScalar(1.07)
          glow.renderOrder = 0
          glow.frustumCulled = false
          mesh.add(glow)
        })
        if (gltf.animations.length > 0) {
          jellyfishMixer = new THREE.AnimationMixer(model)
          gltf.animations.forEach((clip) => {
            const action = jellyfishMixer?.clipAction(clip)
            action?.play()
          })
        }
        model.scale.setScalar(jellyfishBaseScale)
        model.position.set(-18, 33, -68)
        model.rotation.set(-0.22, 0.86, 0.05)
        scene.add(model)
        jellyfish = model
      },
      undefined,
      () => {}
    )

    let animationId = 0
    const clock = new THREE.Clock()

    const updatePointerFromEvent = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) {
        return
      }
      pointerNdc.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      )
      pointerInsideCanvas = true
    }

    const isPointerOnStartButton = () => {
      if (
        !billboardHud.startButtonFill ||
        !startButtonReady ||
        !pointerInsideCanvas
      ) {
        return false
      }

      raycaster.setFromCamera(pointerNdc, camera)
      return (
        raycaster.intersectObject(billboardHud.startButtonFill, false).length >
        0
      )
    }

    const clearPointerState = () => {
      pointerInsideCanvas = false
      startButtonHovered = false
      startButtonPressed = false
      pointerNdc.set(2, 2)
      canvas.style.cursor = 'default'
    }

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerFromEvent(event)
    }

    const handlePointerDown = (event: PointerEvent) => {
      updatePointerFromEvent(event)
      startButtonHovered = isPointerOnStartButton()
      if (startButtonHovered) {
        startButtonPressed = true
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      updatePointerFromEvent(event)
      const isPointerOnButton = isPointerOnStartButton()
      startButtonHovered = isPointerOnButton
      const didPressStart =
        startButtonPressed && startButtonReady && isPointerOnButton
      startButtonPressed = false
      if (didPressStart) {
        startButtonClickPulse = 1
        onStartDemo?.()
      }
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', clearPointerState)
    canvas.addEventListener('pointercancel', clearPointerState)

    const renderFrame = () => {
      animationId = window.requestAnimationFrame(renderFrame)

      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime
      const progress = clamp(progressRef.current ?? 0, 0, 1)
      const billboardFocusProgressRaw = THREE.MathUtils.smoothstep(
        progress,
        0.16,
        1
      )
      const billboardFocusProgress = Math.pow(billboardFocusProgressRaw, 1.8)

      cameraTarget.lerpVectors(
        colonyTarget,
        billboardFocusTarget,
        billboardFocusProgress
      )

      const baseTheta =
        -0.12 +
        (reducedMotion ? 0 : Math.sin(elapsed * 0.1) * 0.045) +
        progress * 0.28
      const focusTheta = 0
      const theta = THREE.MathUtils.lerp(
        baseTheta,
        focusTheta,
        billboardFocusProgress
      )

      const basePhi =
        1.04 +
        (reducedMotion ? 0 : Math.cos(elapsed * 0.08) * 0.018) -
        progress * 0.035
      const focusPhi = Math.PI / 2
      const phi = THREE.MathUtils.lerp(
        basePhi,
        focusPhi,
        billboardFocusProgress
      )

      const baseRadius = 45 - progress * 4.2
      const radius = THREE.MathUtils.lerp(
        baseRadius,
        5.3,
        billboardFocusProgress
      )

      updateCamera(theta, phi, radius)

      const loadingProgress = billboardFocusProgress
      const startButtonReveal = THREE.MathUtils.smoothstep(
        loadingProgress,
        0.9,
        1
      )
      const showLoadingIndicators = startButtonReveal <= 0
      startButtonReady = startButtonReveal > 0.96

      if (
        billboardHud.startButtonFill &&
        startButtonReady &&
        pointerInsideCanvas
      ) {
        startButtonHovered = isPointerOnStartButton()
      } else {
        startButtonHovered = false
        startButtonPressed = false
      }
      canvas.style.cursor = startButtonHovered ? 'pointer' : 'default'
      startButtonClickPulse = Math.max(
        0,
        startButtonClickPulse - (reducedMotion ? 0.05 : 0.028)
      )
      const hoverLerpFactor = 1 - Math.exp(-delta * (reducedMotion ? 9 : 7))
      const pressLerpFactor = 1 - Math.exp(-delta * (reducedMotion ? 13 : 10))
      startButtonHoverMix = THREE.MathUtils.lerp(
        startButtonHoverMix,
        startButtonHovered ? 1 : 0,
        hoverLerpFactor
      )
      startButtonPressMix = THREE.MathUtils.lerp(
        startButtonPressMix,
        startButtonPressed ? 1 : 0,
        pressLerpFactor
      )
      const startButtonHover = startButtonHoverMix
      const startButtonPress = startButtonPressMix

      if (billboardHud.spinner) {
        billboardHud.spinner.visible = showLoadingIndicators
        const material = billboardHud.spinner
          .material as THREE.LineBasicMaterial
        if (showLoadingIndicators) {
          billboardHud.spinner.rotation.z = elapsed * 1.9
          material.opacity = 0.86
        } else {
          material.opacity = 0
        }
      }
      if (billboardHud.spinnerCore) {
        billboardHud.spinnerCore.visible = showLoadingIndicators
      }
      billboardHud.chartLines.forEach((line, index) => {
        line.visible = showLoadingIndicators
        const material = line.material as THREE.LineBasicMaterial
        material.opacity = showLoadingIndicators
          ? 0.48 + Math.sin(elapsed * 1.6 + index * 0.9) * 0.18
          : 0
      })
      billboardHud.bars.forEach((bar, index) => {
        bar.visible = showLoadingIndicators
        if (!showLoadingIndicators) {
          const material = bar.material as THREE.MeshBasicMaterial
          material.opacity = 0
          return
        }

        const bottom = bar.userData.bottom as number
        const baseHeight = bar.userData.baseHeight as number
        const phase = bar.userData.phase as number
        const scaleY = 0.3 + Math.abs(Math.sin(elapsed * 1.7 + phase)) * 0.94
        bar.scale.y = scaleY
        bar.position.y = bottom + (baseHeight * scaleY) / 2

        const material = bar.material as THREE.MeshBasicMaterial
        material.opacity = 0.16 + scaleY * 0.16 + index * 0.01
      })
      if (billboardHud.progressTrack) {
        billboardHud.progressTrack.visible = showLoadingIndicators
        const material = billboardHud.progressTrack
          .material as THREE.MeshBasicMaterial
        material.opacity = showLoadingIndicators ? 0.16 : 0
      }
      if (billboardHud.progressFill) {
        billboardHud.progressFill.visible = showLoadingIndicators
        const scaleX = 0.08 + loadingProgress * 0.92
        billboardHud.progressFill.scale.x = scaleX
        billboardHud.progressFill.position.x =
          -billboardHud.progressTrackWidth / 2 +
          (billboardHud.progressTrackWidth * scaleX) / 2
        const material = billboardHud.progressFill
          .material as THREE.MeshBasicMaterial
        material.opacity = showLoadingIndicators ? 0.34 : 0
      }
      if (billboardHud.scanLine) {
        billboardHud.scanLine.visible = showLoadingIndicators
        const sweep = loadingProgress
        billboardHud.scanLine.position.y =
          -billboardHud.screenHeight * 0.36 +
          sweep * billboardHud.screenHeight * 0.72
        const material = billboardHud.scanLine
          .material as THREE.MeshBasicMaterial
        material.opacity = showLoadingIndicators
          ? 0.12 + Math.sin(elapsed * 2.8) * 0.04
          : 0
      }
      billboardHud.statusDots.forEach((dot, index) => {
        dot.visible = showLoadingIndicators
        const pulse = Math.max(0, Math.sin(elapsed * 2.5 - index * 0.9))
        const material = dot.material as THREE.MeshBasicMaterial
        material.opacity = showLoadingIndicators
          ? 0.12 + pulse * 0.24 + loadingProgress * 0.06
          : 0
      })
      if (billboardHud.startButtonFill) {
        const material = billboardHud.startButtonFill
          .material as THREE.MeshBasicMaterial
        material.opacity =
          startButtonReveal > 0
            ? 0.08 +
              startButtonReveal * 0.18 +
              startButtonHover * 0.18 +
              startButtonClickPulse * 0.16 +
              Math.sin(elapsed * 1.4) * 0.02
            : 0
        const pulseScale =
          1 +
          startButtonReveal * 0.04 +
          startButtonHover * 0.1 +
          startButtonClickPulse * 0.06 -
          startButtonPress * 0.035 +
          Math.sin(elapsed * 1.1) * 0.01
        billboardHud.startButtonFill.scale.set(pulseScale, pulseScale, 1)
      }
      if (billboardHud.startButtonGlow) {
        const material = billboardHud.startButtonGlow
          .material as THREE.MeshBasicMaterial
        material.opacity =
          startButtonReveal > 0
            ? 0.04 +
              startButtonReveal * 0.12 +
              startButtonHover * 0.14 +
              startButtonClickPulse * 0.2 +
              Math.sin(elapsed * 1.2) * 0.024
            : 0
        const glowScale =
          1 +
          startButtonReveal * 0.08 +
          startButtonHover * 0.18 +
          startButtonClickPulse * 0.12
        billboardHud.startButtonGlow.scale.set(glowScale, glowScale, 1)
      }
      if (billboardHud.startButtonOutline) {
        const material = billboardHud.startButtonOutline
          .material as THREE.LineBasicMaterial
        material.opacity =
          startButtonReveal > 0
            ? 0.2 +
              startButtonReveal * 0.32 +
              startButtonHover * 0.18 +
              startButtonClickPulse * 0.18
            : 0
        const outlineScale =
          1 + startButtonHover * 0.085 + startButtonClickPulse * 0.06
        billboardHud.startButtonOutline.scale.set(outlineScale, outlineScale, 1)
      }
      if (billboardHud.startButtonSheen) {
        const material = billboardHud.startButtonSheen
          .material as THREE.MeshBasicMaterial

        const hoverSweepSpeed = reducedMotion ? 0.22 : 0.34
        const idleSweepSpeed = reducedMotion ? 0.08 : 0.14
        const sweepSpeed = startButtonHovered ? hoverSweepSpeed : idleSweepSpeed
        startButtonSheenSweep = (startButtonSheenSweep + delta * sweepSpeed) % 1

        if (startButtonHovered) {
          const sweep = startButtonSheenSweep
          billboardHud.startButtonSheen.position.x =
            -billboardHud.startButtonWidth * 0.52 +
            sweep * billboardHud.startButtonWidth * 1.04

          const sweepFade = Math.sin(sweep * Math.PI)
          material.opacity =
            startButtonReveal *
            (0.08 + sweepFade * 0.24 + startButtonClickPulse * 0.08)
        } else {
          const idleSweep = startButtonSheenSweep
          billboardHud.startButtonSheen.position.x =
            -billboardHud.startButtonWidth * 0.34 +
            idleSweep * billboardHud.startButtonWidth * 0.68
          material.opacity =
            startButtonReveal > 0 ? 0.015 + startButtonReveal * 0.03 : 0
        }
      }
      if (billboardHud.startButtonLabel) {
        const material = billboardHud.startButtonLabel
          .material as THREE.MeshBasicMaterial
        material.opacity =
          startButtonReveal *
          (0.82 + startButtonHover * 0.18 + startButtonClickPulse * 0.15)
        const labelScale =
          1 + startButtonHover * 0.05 + startButtonClickPulse * 0.03
        billboardHud.startButtonLabel.scale.set(labelScale, labelScale, 1)
      }

      const shootingStep = reducedMotion ? 0.09 : 0.64
      shootingStars.forEach((star, index) => {
        star.head.addScaledVector(star.velocity, shootingStep)
        if (star.head.x < -120 || star.head.y < 0 || star.head.z > 78) {
          resetShootingStar(star, !reducedMotion)
        }

        const direction = star.velocity.clone().normalize()
        const tail = star.head.clone().addScaledVector(direction, -star.length)
        const positions = star.line.geometry.attributes
          .position as THREE.BufferAttribute
        positions.setXYZ(0, star.head.x, star.head.y, star.head.z)
        positions.setXYZ(1, tail.x, tail.y, tail.z)
        positions.needsUpdate = true

        const material = star.line.material as THREE.LineBasicMaterial
        material.opacity = reducedMotion
          ? 0.16
          : 0.26 + Math.sin(elapsed * 2.1 + index * 0.7) * 0.12
      })

      if (jellyfishMixer) {
        jellyfishMixer.update(reducedMotion ? delta * 0.5 : delta)
      }

      if (jellyfish) {
        const d = reducedMotion ? 0.4 : 1

        // Multi-frequency drift — each axis has two competing sine waves
        jellyfish.position.x =
          -18 +
          (Math.sin(elapsed * 0.22) * 9.2 + Math.sin(elapsed * 0.51) * 3.4) * d
        jellyfish.position.y =
          33 +
          (Math.sin(elapsed * 0.64) * 4.2 + Math.cos(elapsed * 1.18) * 1.6) * d
        jellyfish.position.z =
          -68 +
          (Math.cos(elapsed * 0.19) * 7.8 + Math.sin(elapsed * 0.44) * 2.8) * d

        // Slow precession + organic tilt
        jellyfish.rotation.y = elapsed * 0.12 * d
        jellyfish.rotation.x =
          -0.22 +
          (Math.sin(elapsed * 0.38) * 0.22 + Math.sin(elapsed * 0.93) * 0.07) *
            d
        jellyfish.rotation.z =
          (Math.cos(elapsed * 0.55) * 0.28 + Math.cos(elapsed * 1.1) * 0.06) * d

        // Breathing pulse — two harmonics so it never feels mechanical
        const breathe =
          1 +
          (Math.sin(elapsed * 1.85) * 0.1 + Math.sin(elapsed * 3.6) * 0.028) * d

        // Vertical squash/stretch — jellyfish contract vertically when they pulse
        jellyfish.scale.set(
          jellyfishBaseScale * breathe,
          jellyfishBaseScale * (2 - breathe) * 0.96, // squash inverse of breathe
          jellyfishBaseScale * breathe
        )
      }

      if (!reducedMotion) {
        stars.rotation.y += 0.0013
        deepStars.rotation.y += 0.00035
        coreStars.rotation.y += 0.0006
        skyParticles.rotation.y += 0.0008
        skyParticles.rotation.x += 0.00016
      }
      coreStarsMaterial.opacity = 0.45 + Math.sin(elapsed * 1.2 + 2.1) * 0.08
      starsMaterial.opacity = 0.28 + Math.sin(elapsed * 0.9) * 0.05
      deepStarsMaterial.opacity = 0.2 + Math.sin(elapsed * 0.55 + 1.7) * 0.04
      skyParticlesMaterial.opacity = 0.2 + Math.sin(elapsed * 1.05 + 0.8) * 0.07

      renderer.render(scene, camera)
    }

    renderFrame()

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', clearPointerState)
      canvas.removeEventListener('pointercancel', clearPointerState)
      canvas.style.cursor = 'default'
      isDisposed = true
      if (jellyfishMixer && jellyfish) {
        jellyfishMixer.stopAllAction()
        jellyfishMixer.uncacheRoot(jellyfish)
      }

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) {
          mesh.geometry.dispose()
        }

        const material = (mesh as THREE.Mesh).material
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose())
        } else if (material) {
          material.dispose()
        }
      })

      billboardHud.textures.forEach((texture) => texture.dispose())

      renderer.dispose()
    }
  }, [onStartDemo, progressRef, reducedMotion])

  return (
    <div className='demo-colony-canvas' aria-hidden='true'>
      <canvas ref={canvasRef} />
    </div>
  )
}
