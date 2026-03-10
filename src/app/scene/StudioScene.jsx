import { ContactShadows, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { EffectComposer } from '@react-three/postprocessing'
import { CameraRig, PhysicalCameraManager, SceneBoundaries, SceneFlags, SceneRulers } from './SceneHelpers'
import { SubjectActor } from './SubjectActor'
import { StudioLight } from './LightRig'
import { GlobalExposureEffect } from './GlobalExposureEffect'
import { SSGI } from './SSGI'

export function StudioScene({
  viewMode,
  focalLength,
  aperture,
  shutterSpeed,
  iso,
  toneMappingExposure,
  lights,
  cam,
  modelUrl,
  subject,
  selected,
  setSelected,
  updateLight,
  setCam,
  setDragging,
  envBrightness,
  lockView,
  interactive,
  isFlashing,
  flashTargets,
  lightLockSubject,
  giEnabled,
  diffuseEnabled,
  highQuality,
  sceneSettings,
  showRulers = false,
  flags,
  updateFlag,
  setSubject,
  showSubjectControlFrame = true,
  postFxQuality = 'high',
}) {
  const cameraRef = useRef(null)
  const { size } = useThree()
  const fov = useMemo(() => {
    const sensorHeight = 24
    const safeFocal = Math.max(1e-3, Number(focalLength) || 50)
    return 2 * Math.atan(sensorHeight / (2 * safeFocal)) * (180 / Math.PI)
  }, [focalLength])

  useEffect(() => {
    if (viewMode !== 'camera' || !cameraRef.current) return
    cameraRef.current.fov = fov
    cameraRef.current.aspect = size.width / Math.max(1, size.height)
    cameraRef.current.updateProjectionMatrix()
  }, [fov, size.height, size.width, viewMode])

  return (
    <>
      <PhysicalCameraManager
        aperture={aperture}
        shutterSpeed={shutterSpeed}
        iso={iso}
        toneMappingExposure={toneMappingExposure}
      />
      <color attach="background" args={['#000000']} />

      {viewMode === 'studio' ? (
        <>
          <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={42} />
          <OrbitControls
            makeDefault
            target={[subject.position[0], 1, subject.position[2]]}
            enabled={!lockView}
            enablePan={!lockView}
            enableRotate={!lockView}
            enableZoom={!lockView}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.78}
            zoomSpeed={0.85}
            panSpeed={0.72}
            minDistance={1.8}
            maxDistance={30}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI * 0.48}
          />
        </>
      ) : viewMode === 'top' ? (
        <OrthographicCamera makeDefault position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={90} />
      ) : (
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          manual
          position={cam.position}
          rotation={cam.rotation}
          fov={fov}
        />
      )}

      {envBrightness > 0 ? (
        <pointLight position={[0, 8, 0]} intensity={envBrightness * 260} distance={50} decay={2} />
      ) : null}

      <SubjectActor
        modelUrl={modelUrl}
        subject={subject}
        setSubject={setSubject}
        setDragging={setDragging}
        highQuality={highQuality}
        interactive={interactive}
        selected={selected}
        setSelected={setSelected}
        showControlFrame={showSubjectControlFrame}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[Math.max(40, (sceneSettings.width || 14) + 8), Math.max(40, (sceneSettings.depth || 12) + 8)]} />
        <meshStandardMaterial
          color="#d3d8df"
          roughness={0.88}
          metalness={0.02}
          clearcoat={0.04}
          clearcoatRoughness={0.9}
        />
      </mesh>

      <SceneBoundaries settings={sceneSettings} />
      <SceneRulers enabled={showRulers && viewMode === 'studio'} subject={subject} lights={lights} cam={cam} />
      <SceneFlags
        flags={flags}
        interactive={interactive}
        selected={selected}
        setSelected={setSelected}
        updateFlag={updateFlag}
        setDragging={setDragging}
      />

      {highQuality ? (
        <ContactShadows
          position={[subject.position[0], 0.02, subject.position[2]]}
          opacity={0.9}
          scale={15}
          blur={1}
          far={6}
          resolution={1024}
        />
      ) : null}

      <CameraRig
        cam={cam}
        selected={selected}
        setSelected={setSelected}
        setCam={setCam}
        setDragging={setDragging}
        visible={viewMode === 'studio'}
        interactive={interactive}
      />

      {lights.map((light) => (
        <StudioLight
          key={light.id}
          light={light}
          selected={selected}
          setSelected={setSelected}
          updateLight={updateLight}
          setDragging={setDragging}
          interactive={interactive}
          isFlashing={isFlashing}
          flashTargets={flashTargets}
          lightLockSubject={lightLockSubject}
          subjectPos={[subject.position[0], subject.position[1] + 1.2, subject.position[2]]}
        />
      ))}

      {viewMode !== 'top' && (giEnabled || diffuseEnabled) ? (
        <EffectComposer multisampling={viewMode === 'studio' ? (postFxQuality === 'balanced' ? 0 : 2) : 2}>
          <SSGI
            distance={10}
            thickness={10}
            maxRoughness={1}
            blend={0.9}
            enableGI={giEnabled}
            enableDiffuse={diffuseEnabled}
            quality={postFxQuality}
          />
          <GlobalExposureEffect exposure={toneMappingExposure} />
        </EffectComposer>
      ) : null}
    </>
  )
}
