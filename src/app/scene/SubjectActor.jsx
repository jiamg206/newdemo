import { Component, Suspense, useEffect, useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { BufferAttribute, Color, MeshPhysicalMaterial, SRGBColorSpace } from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { DEFAULT_MODEL_URL } from '../config/constants'
import { useManipulator } from '../hooks/useManipulator'
import { normalizeModelTransform } from '../utils/lightingMath'

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Keep scene alive.
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function RawImportedModel({ url }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => cloneSkeleton(scene), [scene])

  useEffect(() => {
    // Force local origin reset so model follows outer control group transforms.
    cloned.position.set(0, 0, 0)
    cloned.rotation.set(0, 0, 0)
    cloned.traverse((obj) => {
      if (!obj.isMesh) return
      obj.castShadow = true
      obj.receiveShadow = true
    })
    cloned.updateMatrixWorld(true)
    normalizeModelTransform(cloned)
    cloned.updateMatrixWorld(true)
  }, [cloned])

  return <primitive object={cloned} position={[0, 0, 0]} rotation={[0, 0, 0]} />
}

function TexturedSkinModel({ url }) {
  const { scene } = useGLTF(url)
  const textures = useTexture({
    map: '/textures/skin/map.jpg',
    normalMap: '/textures/skin/normalMap.jpg',
    roughnessMap: '/textures/skin/roughnessMap.jpg',
    aoMap: '/textures/skin/aoMap.jpg',
  })
  const cloned = useMemo(() => cloneSkeleton(scene), [scene])

  useEffect(() => {
    // Force local origin reset so model follows outer control group transforms.
    cloned.position.set(0, 0, 0)
    cloned.rotation.set(0, 0, 0)
    // eslint-disable-next-line react-hooks/immutability -- Three.js textures require runtime flag updates.
    textures.map.colorSpace = SRGBColorSpace
    Object.values(textures).forEach((t) => {
      t.flipY = false
      t.needsUpdate = true
    })

    const created = []
    cloned.traverse((obj) => {
      if (!obj.isMesh) return
      const geometry = obj.geometry
      if (geometry?.attributes?.uv && !geometry.attributes.uv2) {
        geometry.setAttribute('uv2', new BufferAttribute(new Float32Array(geometry.attributes.uv.array), 2))
      }

      const mat = new MeshPhysicalMaterial({
        map: textures.map,
        normalMap: textures.normalMap,
        roughnessMap: textures.roughnessMap,
        aoMap: textures.aoMap,
        roughness: 0.72,
        transmission: 0.08,
        thickness: 0.7,
        attenuationColor: new Color('#bb6c62'),
        attenuationDistance: 1.2,
        clearcoat: 0.06,
        clearcoatRoughness: 0.52,
      })
      obj.material = mat
      obj.castShadow = true
      obj.receiveShadow = true
      created.push(mat)
    })
    cloned.updateMatrixWorld(true)
    normalizeModelTransform(cloned)
    cloned.updateMatrixWorld(true)

    return () => created.forEach((m) => m.dispose())
  }, [cloned, textures])

  return <primitive object={cloned} position={[0, 0, 0]} rotation={[0, 0, 0]} />
}

function FallbackSubject() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.23, 1, 10, 20]} />
        <meshPhysicalMaterial
          color="#efeae4"
          roughness={0.52}
          transmission={0.06}
          thickness={0.6}
          attenuationColor="#bb6c62"
          attenuationDistance={1.2}
        />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.17, 28, 28]} />
        <meshPhysicalMaterial
          color="#efeae4"
          roughness={0.5}
          transmission={0.06}
          thickness={0.5}
          attenuationColor="#bb6c62"
          attenuationDistance={1.2}
        />
      </mesh>
    </group>
  )
}

export function SubjectActor({
  modelUrl,
  subject,
  setSubject,
  setDragging,
  highQuality,
  interactive,
  selected,
  setSelected,
  showControlFrame = true,
}) {
  const handlers = useManipulator(
    subject,
    (patch) => setSubject((prev) => ({ ...prev, ...patch })),
    setDragging,
    {
      enabled: selected?.type === 'subject',
      wheelMode: 'scale',
      minScale: 0.2,
      maxScale: Infinity,
    },
  )

  const useSkinTextures = highQuality && modelUrl === DEFAULT_MODEL_URL && DEFAULT_MODEL_URL.includes('CesiumMan')
  const hitRadius = 1.4 * (subject.scale || 1)

  return (
    <group
      name="subject-control-root"
      position={subject.position}
      rotation={subject.rotation}
      scale={subject.scale || 1}
    >
      <group name="subject-model-layer">
        <ModelErrorBoundary key={modelUrl} fallback={<RawImportedModel url={modelUrl} />}>
          <Suspense fallback={<FallbackSubject />}>
            {useSkinTextures ? <TexturedSkinModel url={modelUrl} /> : <RawImportedModel url={modelUrl} />}
          </Suspense>
        </ModelErrorBoundary>
      </group>

      {interactive ? (
        <mesh
          position={[0, 1.1, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setSelected({ type: 'subject', id: 'subject' })
          }}
          {...handlers}
        >
          <sphereGeometry args={[hitRadius, 18, 18]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {selected?.type === 'subject' && interactive ? (
        <mesh position={[0, 1.1, 0]} visible={showControlFrame}>
          <boxGeometry args={[1.0, 2.2, 0.8]} />
          <meshBasicMaterial color="#22d3ee" wireframe />
        </mesh>
      ) : null}
    </group>
  )
}
