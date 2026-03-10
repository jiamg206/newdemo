import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { useManipulator } from '../hooks/useManipulator'
import { EXPOSURE_CALIBRATION, computeEV, evToToneMappingExposure } from '../utils/exposureMath'

export function PhysicalCameraManager({
  aperture,
  shutterSpeed,
  iso,
  calibration = EXPOSURE_CALIBRATION,
  toneMappingExposure,
}) {
  const { gl } = useThree()
  const resolvedExposure = useMemo(() => {
    const nextExposure = Number.isFinite(toneMappingExposure)
      ? toneMappingExposure
      : evToToneMappingExposure(computeEV({ aperture, shutterSpeed, iso }), calibration)
    return Number.isFinite(nextExposure) ? nextExposure : 1
  }, [aperture, shutterSpeed, iso, calibration, toneMappingExposure])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- R3F renderer exposure is imperative state.
    gl.toneMappingExposure = resolvedExposure
  }, [gl, resolvedExposure])

  useFrame(() => {
    // Composer/effects may override renderer exposure per frame; force-sync each frame.
    if (Math.abs(gl.toneMappingExposure - resolvedExposure) > 1e-6) {
      // eslint-disable-next-line react-hooks/immutability -- renderer state is imperative.
      gl.toneMappingExposure = resolvedExposure
    }
  })

  return null
}

function FlagItem({ flag, interactive, selected, setSelected, updateFlag, setDragging }) {
  const handlers = useManipulator(
    flag,
    (patch) => updateFlag(flag.id, patch),
    setDragging,
    {
      enabled: interactive && selected?.type === 'flag' && selected?.id === flag.id,
      wheelMode: 'height',
      minY: 0.2,
      maxY: 5,
    },
  )

  return (
    <group key={flag.id} position={flag.position} rotation={flag.rotation || [0, 0, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.04, 1.6, 0.04]} />
        <meshStandardMaterial color="#5b6472" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[flag.width * 0.5, 1.05, 0]} castShadow receiveShadow>
        <planeGeometry args={[flag.width, flag.height]} />
        <meshStandardMaterial
          color={flag.type === 'black' ? '#111215' : '#f3f4f6'}
          roughness={0.82}
          metalness={0.03}
          side={2}
        />
      </mesh>

      {interactive ? (
        <mesh
          position={[flag.width * 0.5, 1.0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'flag', id: flag.id })
          }}
          {...handlers}
        >
          <boxGeometry args={[Math.max(flag.width, 0.5), 1.9, 0.45]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {selected?.type === 'flag' && selected.id === flag.id && interactive ? (
        <mesh position={[flag.width * 0.5, 1.0, 0]}>
          <boxGeometry args={[Math.max(flag.width, 0.5), 1.8, 0.36]} />
          <meshBasicMaterial color="#22d3ee" wireframe />
        </mesh>
      ) : null}
    </group>
  )
}

export function SceneFlags({
  flags,
  interactive = false,
  selected,
  setSelected,
  updateFlag = () => {},
  setDragging = () => {},
}) {
  return flags.map((flag) => (
    <FlagItem
      key={flag.id}
      flag={flag}
      interactive={interactive}
      selected={selected}
      setSelected={setSelected}
      updateFlag={updateFlag}
      setDragging={setDragging}
    />
  ))
}

export function SceneBoundaries({ settings }) {
  if (!settings.enabled) return null
  const wallColor = settings.wallTone === 'white' ? '#eceff3' : '#c6ccd4'
  const width = settings.width || 14
  const depth = settings.depth || 12
  const height = settings.ceilingHeight || 3.5
  const halfW = width / 2
  const halfD = depth / 2

  return (
    <group>
      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} metalness={0.01} />
      </mesh>
      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} metalness={0.01} />
      </mesh>
      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} metalness={0.01} />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.94} metalness={0} />
      </mesh>
    </group>
  )
}

function HeightMarker({ position, height, color, label }) {
  const safeHeight = Math.max(0.05, height)
  return (
    <group position={[position[0], 0, position[2]]}>
      <Line points={[[0, 0, 0], [0, safeHeight, 0]]} color={color} lineWidth={1} />
      <mesh position={[0, safeHeight, 0]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[0, safeHeight + 0.08, 0]} center distanceFactor={9} transform>
        <div className="rounded border border-zinc-600 bg-zinc-950/90 px-2 py-1 text-[10px] text-zinc-200 shadow">
          {label}
        </div>
      </Html>
    </group>
  )
}

function HeightAxisRuler({ maxCm = 400, stepCm = 10, x = -1.6, z = -1.4 }) {
  const maxM = Math.max(0.5, maxCm / 100)
  const ticksCm = []
  for (let value = 0; value <= maxCm + 1e-6; value += stepCm) ticksCm.push(value)

  return (
    <group position={[x, 0, z]}>
      <Line points={[[0, 0, 0], [0, maxM, 0]]} color="#818cf8" lineWidth={1.2} />
      {ticksCm.map((tickCm) => (
        <Line
          key={`height-tick-${tickCm}`}
          points={[[-0.08, tickCm / 100, 0], [0.08, tickCm / 100, 0]]}
          color={tickCm === 0 ? '#a5b4fc' : '#64748b'}
          lineWidth={1}
        />
      ))}
      {ticksCm
        .filter((tickCm) => tickCm % 50 === 0)
        .map((tickCm) => (
          <Html key={`height-label-${tickCm}`} position={[0.22, tickCm / 100, 0]} center distanceFactor={10} transform>
            <div className="rounded border border-zinc-700 bg-zinc-950/90 px-1 py-0.5 text-[9px] text-zinc-200 shadow">
              {tickCm}cm
            </div>
          </Html>
        ))}
      <Html position={[0.35, maxM + 0.12, 0]} center distanceFactor={10} transform>
        <div className="rounded border border-indigo-400/40 bg-zinc-950/90 px-2 py-0.5 text-[10px] text-indigo-200 shadow">
          Height (cm)
        </div>
      </Html>
    </group>
  )
}

export function SceneRulers({ enabled, subject, lights, cam }) {
  if (!enabled) return null

  const subjectHeight = Math.max(1.4, 1.75 * (Number(subject?.scale) || 1))
  const camHeight = Math.max(0.1, Number(cam?.position?.[1]) || 0)

  return (
    <group>
      <gridHelper args={[30, 30, '#334155', '#1f2937']} position={[0, 0.01, 0]} />
      <HeightAxisRuler />
      <HeightMarker
        position={subject.position}
        height={subjectHeight}
        color="#22c55e"
        label={`Subject h ${Math.round(subjectHeight * 100)}cm`}
      />
      {lights.map((light) => (
        <HeightMarker
          key={`ruler-${light.id}`}
          position={light.position}
          height={Math.max(0.1, light.position[1])}
          color="#22d3ee"
          label={`${light.group} h ${Math.round(light.position[1] * 100)}cm`}
        />
      ))}
      {cam?.position ? (
        <HeightMarker
          position={cam.position}
          height={camHeight}
          color="#f59e0b"
          label={`Camera h ${Math.round(camHeight * 100)}cm`}
        />
      ) : null}
    </group>
  )
}

export function CameraRig({ cam, selected, setSelected, setCam, setDragging, visible = true, interactive = true }) {
  const isSelected = interactive && selected?.type === 'camera' && selected?.id === 'camera'
  const handlers = useManipulator(
    cam,
    (patch) => setCam((prev) => ({ ...prev, ...patch })),
    setDragging,
    {
      enabled: isSelected,
      wheelMode: 'height',
      minY: 0.2,
      maxY: 6,
    },
  )
  if (!visible) return null

  return (
    <group position={cam.position} rotation={cam.rotation}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.28]} />
        <meshStandardMaterial color="#1a2029" metalness={0.32} roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.15, -0.2]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.18, 30]} />
        <meshStandardMaterial color="#232935" roughness={0.34} metalness={0.62} />
      </mesh>

      {interactive && !isSelected ? (
        <mesh
          position={[0, 0.15, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'camera', id: 'camera' })
          }}
        >
          <boxGeometry args={[0.95, 1.2, 0.95]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {isSelected ? (
        <mesh
          position={[0, 0.15, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'camera', id: 'camera' })
          }}
          {...handlers}
        >
          <boxGeometry args={[0.58, 0.38, 0.32]} />
          <meshBasicMaterial color="#22d3ee" wireframe />
        </mesh>
      ) : null}
    </group>
  )
}
