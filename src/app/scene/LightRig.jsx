import { useEffect, useMemo, useRef } from 'react'
import { Helper } from '@react-three/drei'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  SpotLightHelper as ThreeSpotLightHelper,
} from 'three'
import { CTO_LEVELS, POWER_VALUES } from '../config/constants'
import { useManipulator } from '../hooks/useManipulator'
import { clamp, findAccessory, findModifier, getLookRotation, kelvinToRgb } from '../utils/lightingMath'

const CONTINUOUS_INTENSITY_PER_W = 36
const FLASH_INTENSITY_PER_WS = 10
const MODELING_INTENSITY_PER_W = 18

function createRectGobo(
  width = 1.2,
  height = 0.8,
  { size = 512, maxSpanRatio = 0.74, edgeBlurRatio, coreInsetRatio, centerFalloff = 0 } = {},
) {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, size, size)

  const safeW = Math.max(0.05, Number(width) || 1.2)
  const safeH = Math.max(0.05, Number(height) || 0.8)
  const aspect = safeW / safeH
  const maxSpan = size * clamp(maxSpanRatio, 0.4, 0.95)

  let rectW
  let rectH
  if (aspect >= 1) {
    rectW = maxSpan
    rectH = rectW / aspect
  } else {
    rectH = maxSpan
    rectW = rectH * aspect
  }

  const x = (size - rectW) * 0.5
  const y = (size - rectH) * 0.5

  // Soft edge to mimic diffusion falloff at the gobo boundary.
  const resolvedEdgeBlurRatio = edgeBlurRatio ?? 0.1
  const resolvedCoreInsetRatio = coreInsetRatio ?? 0.008
  ctx.save()
  ctx.shadowColor = 'white'
  ctx.shadowBlur = size * clamp(resolvedEdgeBlurRatio, 0, 0.3)
  ctx.fillStyle = 'white'
  ctx.fillRect(x, y, rectW, rectH)
  ctx.restore()

  const inset = size * clamp(resolvedCoreInsetRatio, 0, 0.1)
  ctx.fillStyle = 'white'
  ctx.fillRect(x + inset, y + inset, Math.max(1, rectW - inset * 2), Math.max(1, rectH - inset * 2))

  const centerFalloffClamped = clamp(centerFalloff, 0, 1)
  if (centerFalloffClamped > 0) {
    const edgeStrength = 1 - centerFalloffClamped * 0.78
    const edgeGray = Math.round(255 * clamp(edgeStrength, 0.05, 1))
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.02, size / 2, size / 2, size * 0.62)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, `rgba(${edgeGray},${edgeGray},${edgeGray},1)`)
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    ctx.restore()
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

function createStripGobo(width = 0.45, height = 1.6, centerFalloff = 0) {
  // Wider blur and smaller hard core to mimic softer edge roll-off similar to 120-class modifiers.
  return createRectGobo(width, height, {
    size: 1024,
    maxSpanRatio: 0.8,
    edgeBlurRatio: 0.12,
    coreInsetRatio: 0.008,
    centerFalloff,
  })
}

function createConeFalloffGobo(centerFalloff = 0, size = 512) {
  const falloff = clamp(centerFalloff, 0, 1)
  if (falloff <= 0 || typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const cx = size * 0.5
  const cy = size * 0.5
  const radius = size * 0.46
  const edgeStrength = clamp(1 - falloff * 0.78, 0.05, 1)
  const edgeGray = Math.round(255 * edgeStrength)

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, size, size)

  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.03, cx, cy, radius)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.82, `rgba(${edgeGray},${edgeGray},${edgeGray},1)`)
  gradient.addColorStop(1, 'rgba(0,0,0,1)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  const texture = new CanvasTexture(canvas)
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

function ModifierMesh({ modifier, width, height }) {
  if (modifier.id === 'softbox_rect' || modifier.id === 'softbox_strip_30120') {
    return (
      <mesh>
        <boxGeometry args={[width || modifier.width || 1.7, height || modifier.height || 1.1, 0.26]} />
        <meshStandardMaterial color="#161a21" roughness={0.82} metalness={0.12} />
      </mesh>
    )
  }

  if (modifier.id === 'octabox_grid') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.42, 0.36, 8]} />
        <meshStandardMaterial color="#141923" roughness={0.52} metalness={0.28} />
      </mesh>
    )
  }

  if (modifier.id === 'snoot') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.08, 0.85, 28]} />
        <meshStandardMaterial color="#0f141c" roughness={0.48} metalness={0.48} />
      </mesh>
    )
  }

  if (modifier.id === 'deep_parabolic_90') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 0.78, 40, 1, true]} />
        <meshStandardMaterial color="#141821" roughness={0.38} metalness={0.35} side={2} />
      </mesh>
    )
  }

  if (modifier.id === 'deep_parabolic_120') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.75, 0.98, 40, 1, true]} />
        <meshStandardMaterial color="#141821" roughness={0.38} metalness={0.35} side={2} />
      </mesh>
    )
  }

  if (modifier.id === 'beauty_dish_55') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.22, 0.25, 36]} />
        <meshStandardMaterial color="#11151d" roughness={0.46} metalness={0.48} />
      </mesh>
    )
  }

  if (modifier.id === 'bare_bulb') {
    return (
      <group>
        <mesh position={[0, 0, -0.12]}>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color="#dddfe2" roughness={0.28} metalness={0.1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.22, 0.24, 0.32, 20]} />
          <meshStandardMaterial color="#151a22" roughness={0.58} metalness={0.3} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.34, 0.55, 36, 1, true]} />
      <meshStandardMaterial color="#141923" roughness={0.42} metalness={0.38} side={2} />
    </mesh>
  )
}

function AccessoryMeshes({ ids }) {
  return (
    <>
      {ids.includes('grid') ? (
        <mesh position={[0, 0, -0.24]}>
          <boxGeometry args={[1.15, 0.75, 0.03]} />
          <meshBasicMaterial color="#22d3ee" wireframe />
        </mesh>
      ) : null}
      {ids.includes('barn') ? (
        <group position={[0, 0, -0.21]}>
          <mesh position={[0, 0.48, 0]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[1.1, 0.12, 0.02]} />
            <meshStandardMaterial color="#0f1218" />
          </mesh>
          <mesh position={[0, -0.48, 0]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[1.1, 0.12, 0.02]} />
            <meshStandardMaterial color="#0f1218" />
          </mesh>
        </group>
      ) : null}
    </>
  )
}

function SpotStudioLight({
  color,
  intensity,
  angle,
  penumbra,
  distance = 0,
  targetDistance = 5,
  goboTexture = null,
  debug = false,
}) {
  const lightRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current
      lightRef.current.needsUpdate = true
    }
  }, [])

  useEffect(() => {
    if (!lightRef.current) return
    lightRef.current.map = goboTexture || null
    lightRef.current.needsUpdate = true
  }, [goboTexture])

  return (
    <>
      <object3D ref={targetRef} position={[0, 0, -Math.max(1.2, targetDistance)]} />
      <spotLight
        ref={lightRef}
        position={[0, 0, -0.1]}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        // 0 = no hard cut-off in Three.js, light fades naturally via decay.
        distance={distance > 0 ? distance : 0}
        decay={2}
        castShadow
        map={goboTexture || null}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      >
        {debug ? <Helper type={ThreeSpotLightHelper} args={['#22d3ee']} /> : null}
      </spotLight>
    </>
  )
}

function resolveLightProfile(modifier, light, subjectDistance = 6) {
  const accessories = light.accessories || []
  const hasGrid = accessories.includes('grid')
  const hasDiff = accessories.includes('diff')
  const hasBarn = accessories.includes('barn')
  const gridHalfAngle = ((light.gridAngle || 20) * Math.PI) / 180 / 2

  const profile = {
    kind: modifier.kind,
    guideShape: modifier.kind === 'rect' ? 'pyramid' : 'cone',
    projectionShape: 'cone',
    angle: modifier.angle ?? Math.PI / 4,
    penumbra: modifier.penumbra ?? 0.3,
    width:
      modifier.id === 'softbox_rect'
        ? clamp(Number(light.rectWidth ?? modifier.width ?? 1.7), 0.3, 3)
        : modifier.width || 1.7,
    height:
      modifier.id === 'softbox_rect'
        ? clamp(Number(light.rectHeight ?? modifier.height ?? 1.1), 0.3, 3)
        : modifier.height || 1.1,
    distance: 30,
    targetDistance: clamp(subjectDistance, 1.5, 30),
    intensityMul: 1,
    focusConstraint: clamp(light.focusConstraint ?? 0.35, 0, 1),
    pyramidWidth: 0,
    pyramidHeight: 0,
    pyramidDepth: 0,
  }

  const isOctaboxGrid = modifier.id === 'octabox_grid'
  const isStripSoftbox = modifier.id === 'softbox_strip_30120'
  const isCustomRectSoftbox = modifier.id === 'softbox_rect'

  if (modifier.kind === 'rect') {
    const beamShape = ['focused', 'standard'].includes(light.beamShape) ? light.beamShape : 'standard'
    const focused = beamShape === 'focused'
    const f = profile.focusConstraint
    const diffuseAngle = modifier.id === 'softbox_strip_30120' ? 0.32 : 0.38
    const focusedMin = modifier.id === 'softbox_strip_30120' ? 0.1 : 0.13
    profile.kind = 'spot'
    profile.guideShape = 'pyramid'
    profile.projectionShape = isStripSoftbox ? 'strip-gobo' : isCustomRectSoftbox ? 'rect-gobo' : 'cone'
    profile.angle = focused
      ? clamp(diffuseAngle - f * (diffuseAngle - focusedMin), focusedMin, diffuseAngle)
      : diffuseAngle
    profile.penumbra = focused ? clamp(0.18 - f * 0.1, 0.05, 0.2) : 0.22
    // Remove hard range limit for rectangular softboxes, rely on physical falloff.
    profile.distance = 0
    profile.targetDistance = clamp(subjectDistance, 1.6, 24)
    profile.intensityMul *= focused ? 1.06 : 1

    if (hasGrid) {
      profile.angle = Math.min(profile.angle * 0.74, gridHalfAngle)
      profile.penumbra = Math.max(0.03, profile.penumbra * 0.75)
    }
  }

  if (isOctaboxGrid) {
    profile.kind = 'spot'
    profile.guideShape = 'cone'
    profile.projectionShape = 'cone'
    profile.angle = Math.min(0.24, gridHalfAngle)
    profile.penumbra = 0.08
  } else if (modifier.id === 'deep_parabolic_90' && hasGrid) {
    profile.kind = 'spot'
    profile.guideShape = 'cone'
    profile.angle = Math.min(0.16, gridHalfAngle)
    profile.penumbra = 0.04
  } else if (modifier.id === 'deep_parabolic_120' && hasGrid) {
    profile.kind = 'spot'
    profile.guideShape = 'cone'
    profile.angle = Math.min(0.2, gridHalfAngle)
    profile.penumbra = 0.06
  } else if (modifier.id === 'standard_reflector' && hasGrid) {
    profile.kind = 'spot'
    profile.guideShape = 'cone'
    profile.angle = Math.min(0.22, gridHalfAngle)
    profile.penumbra = 0.08
  } else if (profile.kind === 'spot' && hasGrid && !['rect-gobo', 'strip-gobo'].includes(profile.projectionShape)) {
    profile.angle = Math.min(profile.angle * 0.68, gridHalfAngle)
    profile.penumbra = Math.max(0.02, profile.penumbra * 0.55)
  }

  if (hasDiff) {
    profile.angle = Math.min(Math.PI / 2, profile.angle * 1.06)
    profile.penumbra = Math.min(0.95, profile.penumbra + 0.12)
    profile.intensityMul *= 0.9
  }

  if (hasBarn && profile.kind === 'spot') {
    profile.angle = Math.max(0.08, profile.angle * 0.88)
    profile.penumbra = Math.max(0.02, profile.penumbra * 0.85)
  }

  if (profile.guideShape === 'pyramid') {
    const depth =
      profile.distance > 0
        ? clamp(Math.max(profile.distance, subjectDistance * 0.9), 2.4, 30)
        : clamp(Math.max(subjectDistance * 3.2, 22), 22, 100)
    const aspect = clamp(profile.width / Math.max(profile.height, 0.2), 0.25, 4)
    const halfHeight = Math.tan(clamp(profile.angle, 0.06, 1.45)) * depth
    profile.pyramidHeight = Math.max(0.25, halfHeight * 2)
    profile.pyramidWidth = Math.max(0.25, profile.pyramidHeight * aspect)
    profile.pyramidDepth = depth
  }

  return profile
}

function LightDirectionGuide({ profile, distance = 6 }) {
  const visualDistance = profile.distance > 0 ? profile.distance : Math.max(40, (profile.targetDistance || distance) * 8)
  const rayDistance = Math.max(1.5, profile.pyramidDepth || visualDistance || profile.targetDistance || distance)

  const redPoints = useMemo(() => new Float32Array([0, 0, 0, 0, 0, -rayDistance]), [rayDistance])

  const bluePoints = useMemo(() => {
    const points = []

    if (profile.guideShape === 'pyramid') {
      const depth = Math.max(1.2, profile.pyramidDepth || rayDistance)
      const width = Math.max(0.25, profile.pyramidWidth || profile.width || 1.2)
      const height = Math.max(0.25, profile.pyramidHeight || profile.height || 0.8)
      const corners = [
        [-width / 2, -height / 2, -depth],
        [width / 2, -height / 2, -depth],
        [width / 2, height / 2, -depth],
        [-width / 2, height / 2, -depth],
      ]
      corners.forEach((c) => points.push(0, 0, 0, c[0], c[1], c[2]))
    } else {
      const segments = 14
      const d = Math.max(1.2, rayDistance)
      const radius = Math.tan(Math.max(0.06, profile.angle || Math.PI / 6)) * d
      for (let i = 0; i < segments; i += 1) {
        const t = (i / segments) * Math.PI * 2
        points.push(0, 0, 0, Math.cos(t) * radius, Math.sin(t) * radius, -d)
      }
    }

    return new Float32Array(points)
  }, [profile.angle, profile.guideShape, profile.height, profile.pyramidDepth, profile.pyramidHeight, profile.pyramidWidth, profile.width, rayDistance])

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[redPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" />
      </line>
      <mesh position={[0, 0, -rayDistance]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bluePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.9} />
      </lineSegments>
    </group>
  )
}

export function StudioLight({
  light,
  selected,
  setSelected,
  updateLight,
  setDragging,
  isFlashing,
  flashTargets,
  lightLockSubject,
  subjectPos,
  interactive = true,
}) {
  const isSelected = interactive && selected?.type === 'light' && selected?.id === light.id
  const handlers = useManipulator(light, (patch) => updateLight(light.id, patch), setDragging, {
    enabled: isSelected,
    wheelMode: 'height',
    minY: 0.2,
    maxY: Infinity,
  })

  const modifier = findModifier(light.modifier)
  const cto = CTO_LEVELS.find((x) => x.id === light.ctoLevel) || CTO_LEVELS[0]
  const accessories = light.accessories || []
  const hasCTO = accessories.includes('cto')

  const guideDistance = useMemo(
    () =>
      Math.sqrt(
        (light.position[0] - subjectPos[0]) ** 2 +
          (light.position[1] - subjectPos[1]) ** 2 +
          (light.position[2] - subjectPos[2]) ** 2,
      ),
    [light.position, subjectPos],
  )

  const accessoryLoss = accessories.reduce((sum, id) => {
    if (id === 'cto') return sum
    return sum + (findAccessory(id)?.loss || 0)
  }, 0)
  const ctoLoss = hasCTO ? cto.loss : 0
  const transmission = Math.pow(2, -((modifier.loss || 0) + accessoryLoss + ctoLoss))
  const lightProfile = resolveLightProfile(modifier, light, guideDistance)

  const edgeFalloff = clamp(light.edgeFalloff ?? 0, 0, 1)
  const projectionTexture = useMemo(() => {
    if (lightProfile.projectionShape === 'rect-gobo') {
      return createRectGobo(lightProfile.width, lightProfile.height, {
        centerFalloff: edgeFalloff,
      })
    }
    if (lightProfile.projectionShape === 'strip-gobo') {
      return createStripGobo(lightProfile.width, lightProfile.height, edgeFalloff)
    }
    return createConeFalloffGobo(edgeFalloff)
  }, [edgeFalloff, lightProfile.height, lightProfile.projectionShape, lightProfile.width])

  useEffect(
    () => () => {
      if (projectionTexture) projectionTexture.dispose()
    },
    [projectionTexture],
  )

  const powerFactor = POWER_VALUES[light.powerIndex] ?? 1
  const maxWs = Math.max(0, Number(light.maxWs ?? light.headWs ?? 0))
  const flashWs = maxWs * powerFactor
  const modelingMaxW = maxWs / 10
  const modelingPower = clamp(light.modelingPower ?? modelingMaxW, 0, modelingMaxW)
  const modelingW = light.modelingOn && light.mode === 'flash' ? modelingPower : 0
  const continuousW = light.mode === 'continuous' ? (light.continuousW ?? maxWs) * powerFactor : 0
  const isTargetedFlash = !Array.isArray(flashTargets) || flashTargets.length === 0 || flashTargets.includes(light.id)
  const flashPulseWs = light.mode === 'flash' && isFlashing && isTargetedFlash ? flashWs : 0
  const totalIntensityBase =
    continuousW * CONTINUOUS_INTENSITY_PER_W +
    flashPulseWs * FLASH_INTENSITY_PER_WS +
    modelingW * MODELING_INTENSITY_PER_W
  const intensity = light.enabled ? totalIntensityBase * transmission * lightProfile.intensityMul : 0
  const colorTemp = hasCTO ? Math.max(2200, light.colorTemp - cto.kelvinShift) : light.colorTemp
  const color = kelvinToRgb(colorTemp)
  const rotation = lightLockSubject ? getLookRotation(light.position, subjectPos) : light.rotation

  return (
    <group position={light.position} rotation={rotation}>
      <ModifierMesh modifier={modifier} width={lightProfile.width} height={lightProfile.height} />
      <AccessoryMeshes ids={accessories} />

      <SpotStudioLight
        color={color}
        intensity={intensity}
        angle={lightProfile.angle}
        penumbra={lightProfile.penumbra}
        distance={lightProfile.distance}
        targetDistance={lightProfile.targetDistance}
        goboTexture={projectionTexture}
        debug={Boolean(light.showGuide)}
      />

      {light.showGuide ? <LightDirectionGuide profile={lightProfile} distance={guideDistance} /> : null}

      {interactive && !isSelected ? (
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'light', id: light.id })
          }}
        >
          <boxGeometry args={[1.9, 1.2, 1.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {isSelected ? (
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'light', id: light.id })
          }}
          {...handlers}
        >
          <boxGeometry args={[1.5, 1, 0.4]} />
          <meshBasicMaterial color="#22d3ee" wireframe />
        </mesh>
      ) : null}
    </group>
  )
}
