import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import {
  ACCESSORIES,
  DEFAULT_MODEL_URL,
  FLASH_MS,
  POWER_VALUES,
  SHUTTER_OPTIONS,
  SUBJECT_DEFAULT_POS,
  TABS,
} from './app/config/constants'
import { useLocalRenders } from './app/hooks/useLocalRenders'
import { StudioScene } from './app/scene/StudioScene'
import { createFlag, createLight } from './app/state/factories'
import { resolveToneMappingExposure } from './app/utils/exposureMath'
import { exportLightingDiagram } from './app/utils/exportLightingDiagram'
import { getLookRotation } from './app/utils/lightingMath'
import { computeSceneBounceBrightness } from './app/utils/lightingPhysics'
import { LeftSidebar } from './app/ui/LeftSidebar'
import { RenderGallery } from './app/ui/RenderGallery'
import { RenderModal } from './app/ui/RenderModal'
import { RightInspector } from './app/ui/RightInspector'
import { TopBar } from './app/ui/TopBar'
import { TopViewModal } from './app/ui/TopViewModal'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const nearestPowerIndex = (fraction) => {
  const target = Number.isFinite(fraction) ? fraction : 1
  let best = 0
  let bestDiff = Math.abs((POWER_VALUES[0] ?? 1) - target)
  for (let i = 1; i < POWER_VALUES.length; i += 1) {
    const diff = Math.abs((POWER_VALUES[i] ?? 1) - target)
    if (diff < bestDiff) {
      best = i
      bestDiff = diff
    }
  }
  return best
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const getModelingMaxW = (lightLike) => {
  const maxWs = Math.max(0, Number(lightLike?.maxWs ?? lightLike?.headWs ?? 0))
  return maxWs / 10
}

const normalizeLightPatch = (patch) => {
  const next = { ...patch }
  const has = (key) => Object.prototype.hasOwnProperty.call(next, key)

  if (has('modifier') && next.modifier === 'softbox_rect_grid') next.modifier = 'softbox_rect'
  if (has('beamShape') && ['diffuse', 'feather'].includes(next.beamShape)) next.beamShape = 'standard'

  if (has('headWs') && !has('maxWs')) next.maxWs = next.headWs
  if (has('maxWs') && !has('headWs')) next.headWs = next.maxWs

  if (has('powerIndex') && !has('fraction')) next.fraction = POWER_VALUES[next.powerIndex] ?? 1
  if (has('fraction') && !has('powerIndex')) next.powerIndex = nearestPowerIndex(next.fraction)

  if (has('modelingScale')) next.modelingScale = Number(next.modelingScale)
  delete next.feather

  return next
}

const waitForFrames = async (count = 2) => {
  if (typeof requestAnimationFrame !== 'function') {
    await wait(Math.max(1, count) * 16)
    return
  }
  let remaining = Math.max(1, count)
  await new Promise((resolve) => {
    const step = () => {
      remaining -= 1
      if (remaining <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

export default function App() {
  const fileInputRef = useRef(null)
  const capture4kRef = useRef(null)
  const previousLightLockRef = useRef(true)

  const [activeTab, setActiveTab] = useState(TABS[0])
  const [iso, setIso] = useState(100)
  const [shutterSpeed, setShutterSpeed] = useState(1 / 125)
  const [aperture, setAperture] = useState(5.6)
  const [focalLength, setFocalLength] = useState(50)
  const [envBrightness, setEnvBrightness] = useState(0)
  const [giEnabled, setGiEnabled] = useState(false)
  const [diffuseEnabled, setDiffuseEnabled] = useState(false)
  const [lightLockSubject, setLightLockSubject] = useState(true)
  const [statusText, setStatusText] = useState('')

  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL_URL)
  const [uploadedModelUrl, setUploadedModelUrl] = useState(null)
  const [subject, setSubject] = useState({
    position: [...SUBJECT_DEFAULT_POS],
    rotation: [0, 0, 0],
    scale: 1,
  })

  const [sceneSettings, setSceneSettings] = useState({
    enabled: true,
    wallTone: 'gray',
    ceilingHeight: 3.5,
    width: 14,
    depth: 12,
  })
  const [showRulers, setShowRulers] = useState(false)
  const [flags, setFlags] = useState([])

  const [lights, setLights] = useState([createLight(0), createLight(1), createLight(2)])
  const [selected, setSelected] = useState({ type: 'light', id: '' })
  const [cam, setCam] = useState({ position: [0, 1.8, 4], rotation: [-0.15, 0, 0] })
  const [dragging, setDragging] = useState(false)
  const [showRender, setShowRender] = useState(false)
  const [showTopView, setShowTopView] = useState(false)
  const [newAccessoryId, setNewAccessoryId] = useState(ACCESSORIES[0].id)
  const [collapsed, setCollapsed] = useState({})
  const [flashPulse, setFlashPulse] = useState({
    active: false,
    targets: null,
    stamp: 0,
  })
  const [isSavingRender, setIsSavingRender] = useState(false)

  const gallery = useLocalRenders()
  const selectedLight = lights.find((item) => item.id === selected.id) || null
  const selectedGroupLabel = selectedLight?.group || 'Group A'
  const shutterLabel = SHUTTER_OPTIONS.find((item) => item.value === shutterSpeed)?.label || '1/125'
  const toneMappingExposure = useMemo(
    () =>
      resolveToneMappingExposure({
        aperture,
        shutterSpeed,
        iso,
      }),
    [aperture, shutterSpeed, iso],
  )
  const cameraViewGl = useMemo(
    () => ({
      antialias: true,
      preserveDrawingBuffer: true,
      toneMapping: ACESFilmicToneMapping,
      outputColorSpace: SRGBColorSpace,
      useLegacyLights: false,
    }),
    [],
  )

  const calcBouncedEnvBrightness = useCallback(
    (useDiffuse) =>
      computeSceneBounceBrightness({
        lights,
        isFlashing: flashPulse.active,
        flashTargets: flashPulse.targets,
        sceneSettings,
        envBrightness,
        diffuseEnabled: useDiffuse,
      }),
    [envBrightness, flashPulse.active, flashPulse.targets, lights, sceneSettings],
  )

  const bouncedEnvBrightness = useMemo(
    () => calcBouncedEnvBrightness(diffuseEnabled),
    [calcBouncedEnvBrightness, diffuseEnabled],
  )
  const mainPostFxHeavy = giEnabled && diffuseEnabled

  const updateLight = (id, patch) => {
    const normalizedPatch = normalizeLightPatch(patch)
    setLights((prev) =>
      prev.map((light) => {
        if (light.id !== id) return light
        const merged = { ...light, ...normalizedPatch }
        const modelingMaxW = getModelingMaxW(merged)
        const hasModelingScale = Object.prototype.hasOwnProperty.call(normalizedPatch, 'modelingScale')
        if (hasModelingScale && !Object.prototype.hasOwnProperty.call(normalizedPatch, 'modelingPower')) {
          const scale = Number(normalizedPatch.modelingScale)
          const normalizedScale = Number.isFinite(scale) ? clamp(scale, 0, 1) : 1
          merged.modelingPower = modelingMaxW * normalizedScale
        }
        const modelingPower = Number(merged.modelingPower)
        merged.modelingPower = clamp(Number.isFinite(modelingPower) ? modelingPower : modelingMaxW, 0, modelingMaxW)
        delete merged.modelingScale
        return merged
      }),
    )
  }

  const updateFlag = (id, patch) => {
    setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, ...patch } : flag)))
  }

  const sceneProps = {
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
    envBrightness: bouncedEnvBrightness,
    lockView: dragging,
    isFlashing: flashPulse.active,
    flashTargets: flashPulse.targets,
    lightLockSubject,
    giEnabled,
    diffuseEnabled,
    sceneSettings,
    showRulers,
    flags,
    updateFlag,
    setSubject,
    showSubjectControlFrame: true,
  }
  const renderSceneProps = {
    ...sceneProps,
    // Keep render preview aligned with the same active lighting baseline.
    envBrightness: bouncedEnvBrightness,
    giEnabled,
    diffuseEnabled,
    showRulers: false,
    showSubjectControlFrame: false,
    selected: { type: 'none', id: '' },
    setSelected: () => {},
    setDragging: () => {},
    updateFlag: () => {},
  }
  const pipSceneProps = {
    ...sceneProps,
    envBrightness: bouncedEnvBrightness,
    giEnabled,
    diffuseEnabled,
    showRulers: false,
    showSubjectControlFrame: false,
    selected: { type: 'none', id: '' },
    setSelected: () => {},
    setDragging: () => {},
    updateFlag: () => {},
  }

  const exportViewLights = useMemo(
    () =>
      lights.map((light) => ({
        ...light,
        enabled: false,
        modelingOn: false,
        mode: 'continuous',
        headWs: 0,
        continuousW: 0,
      })),
    [lights],
  )

  useEffect(() => {
    if (!flashPulse.active) return undefined
    const id = setTimeout(() => {
      setFlashPulse((prev) => ({
        ...prev,
        active: false,
        targets: null,
      }))
    }, FLASH_MS)
    return () => clearTimeout(id)
  }, [flashPulse.active, flashPulse.stamp])

  useEffect(
    () => () => {
      if (uploadedModelUrl) URL.revokeObjectURL(uploadedModelUrl)
    },
    [uploadedModelUrl],
  )

  useEffect(() => {
    if (!statusText) return undefined
    const id = setTimeout(() => setStatusText(''), 2200)
    return () => clearTimeout(id)
  }, [statusText])

  useEffect(() => {
    if (previousLightLockRef.current && !lightLockSubject) {
      const lookTarget = [subject.position[0], subject.position[1] + 1.2, subject.position[2]]
      setLights((prev) =>
        prev.map((light) => ({
          ...light,
          rotation: getLookRotation(light.position, lookTarget),
        })),
      )
    }
    previousLightLockRef.current = lightLockSubject
  }, [lightLockSubject, subject.position])

  const addLight = (headWs = 400) => {
    setLights((prev) => {
      const next = [
        ...prev,
        {
          ...createLight(prev.length),
          maxWs: headWs,
          headWs,
          fraction: 1,
          powerIndex: 0,
          continuousW: headWs,
          modelingPower: headWs / 10,
        },
      ]
      const id = next[next.length - 1].id
      setSelected({ type: 'light', id })
      setCollapsed((state) => ({ ...state, [id]: false }))
      return next
    })
  }

  const removeLight = (id) => {
    setLights((prev) => prev.filter((light) => light.id !== id))
    setCollapsed((state) => {
      const next = { ...state }
      delete next[id]
      return next
    })
    if (selected.id === id) setSelected({ type: 'none', id: '' })
  }

  const addAccessory = (id) => {
    if (!selectedLight || selectedLight.accessories.includes(id)) return
    updateLight(selectedLight.id, { accessories: [...selectedLight.accessories, id] })
  }

  const removeAccessory = (lightId, id) => {
    const light = lights.find((item) => item.id === lightId)
    if (!light) return
    updateLight(lightId, { accessories: light.accessories.filter((item) => item !== id) })
  }

  const addFlag = (type) => setFlags((prev) => [...prev, createFlag(type, prev.length)])
  const removeFlag = (id) => setFlags((prev) => prev.filter((flag) => flag.id !== id))

  const startFlashPulse = (targets = null) => {
    const normalizedTargets = Array.isArray(targets) ? [...targets] : null
    setFlashPulse((prev) => ({
      active: true,
      targets: normalizedTargets,
      stamp: prev.stamp + 1,
    }))
  }

  const triggerShutter = (openRender) => {
    startFlashPulse(null)
    if (openRender) setShowRender(true)
  }

  const triggerLightTest = (lightId) => {
    if (!lightId) return
    startFlashPulse([lightId])
  }

  const onImportModel = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploadedModelUrl) URL.revokeObjectURL(uploadedModelUrl)
    const url = URL.createObjectURL(file)
    setUploadedModelUrl(url)
    setModelUrl(url)
    setSubject({ position: [...SUBJECT_DEFAULT_POS], rotation: [0, 0, 0], scale: 1 })
    e.target.value = ''
  }

  const loadDefaultModel = () => {
    if (uploadedModelUrl) URL.revokeObjectURL(uploadedModelUrl)
    setUploadedModelUrl(null)
    setModelUrl(DEFAULT_MODEL_URL)
    setSubject({ position: [...SUBJECT_DEFAULT_POS], rotation: [0, 0, 0], scale: 1 })
  }

  const captureCurrent4k = async ({ withFlash = false } = {}) => {
    let retries = 0
    while (!capture4kRef.current && retries < 40) {
      retries += 1
      await wait(25)
    }
    if (!capture4kRef.current) return null
    await waitForFrames(2)
    if (withFlash) {
      startFlashPulse(null)
      await waitForFrames(2)
      await wait(10)
    }
    return capture4kRef.current()
  }

  const download4k = async () => {
    const data = await captureCurrent4k({ withFlash: true })
    if (!data) return
    const a = document.createElement('a')
    a.href = data
    a.download = `render-4k-${Date.now()}.png`
    a.click()
  }

  const saveRenderLocal = async () => {
    if (isSavingRender) return
    setIsSavingRender(true)
    try {
      const data = await captureCurrent4k({ withFlash: true })
      if (!data) return
      await gallery.saveFromDataUrl(data, {
        iso,
        shutter: shutterLabel,
        aperture,
        focalLength,
        lights: lights.length,
      })
      setStatusText('已保存到本地作品库')
    } finally {
      setIsSavingRender(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-100" onContextMenu={(e) => e.preventDefault()}>
      <TopBar
        iso={iso}
        setIso={setIso}
        shutterSpeed={shutterSpeed}
        setShutterSpeed={setShutterSpeed}
        aperture={aperture}
        setAperture={setAperture}
        focalLength={focalLength}
        setFocalLength={setFocalLength}
        envBrightness={envBrightness}
        setEnvBrightness={setEnvBrightness}
        giEnabled={giEnabled}
        setGiEnabled={setGiEnabled}
        diffuseEnabled={diffuseEnabled}
        setDiffuseEnabled={setDiffuseEnabled}
        lightLockSubject={lightLockSubject}
        setLightLockSubject={setLightLockSubject}
        renderCount={gallery.items.length}
        onTriggerShutter={() => triggerShutter(false)}
        onOpenRender={() => triggerShutter(true)}
        onOpenTopView={() => setShowTopView(true)}
      />

      <main className="flex h-[calc(100vh-68px)]">
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          modelUrl={modelUrl}
          fileInputRef={fileInputRef}
          onImportModel={onImportModel}
          loadDefaultModel={loadDefaultModel}
          addLight={addLight}
          sceneSettings={sceneSettings}
          setSceneSettings={setSceneSettings}
          showRulers={showRulers}
          setShowRulers={setShowRulers}
          flags={flags}
          addFlag={addFlag}
          updateFlag={updateFlag}
          removeFlag={removeFlag}
          newAccessoryId={newAccessoryId}
          setNewAccessoryId={setNewAccessoryId}
          addAccessory={addAccessory}
        />

        <section className="relative flex-1 bg-zinc-900">
          <Canvas
            shadows
            dpr={mainPostFxHeavy ? [1, 1.35] : [1, 2]}
            gl={{
              antialias: true,
              toneMapping: ACESFilmicToneMapping,
              outputColorSpace: SRGBColorSpace,
              useLegacyLights: false,
            }}
            className="h-full w-full"
          >
            <StudioScene
              {...sceneProps}
              viewMode="studio"
              interactive
              highQuality={false}
              postFxQuality={mainPostFxHeavy ? 'balanced' : 'high'}
            />
          </Canvas>

          <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg border border-zinc-700 bg-zinc-950/85 px-3 py-2 text-[11px] text-zinc-400">
            环境亮度为基础值，灯光会通过场景边界反射自动抬升亮度。</div>

          <RenderGallery
            items={gallery.items}
            isLoading={gallery.isLoading}
            onRemove={gallery.remove}
            onClearAll={gallery.clearAll}
          />

          <div className="absolute bottom-4 right-4 w-[320px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/90 shadow-2xl">
            <div className="px-2 py-1 text-[11px] text-zinc-400">相机画中画（实时）</div>
            <div className="aspect-[3/2] w-full">
              <Canvas
                shadows
                dpr={mainPostFxHeavy ? [1, 1.2] : [1, 1.5]}
                gl={cameraViewGl}
                className="h-full w-full"
              >
                <StudioScene
                  {...pipSceneProps}
                  viewMode="camera"
                  interactive={false}
                  highQuality={false}
                  lockView={false}
                  postFxQuality={mainPostFxHeavy ? 'balanced' : 'high'}
                />
              </Canvas>
            </div>
          </div>
        </section>

        <RightInspector
          lights={lights}
          selected={selected}
          setSelected={setSelected}
          selectedGroupLabel={selectedGroupLabel}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          updateLight={updateLight}
          triggerShutter={triggerShutter}
          triggerLightTest={triggerLightTest}
          removeAccessory={removeAccessory}
          removeLight={removeLight}
        />
      </main>

      {statusText ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-zinc-950">
          {statusText}
        </div>
      ) : null}

      <RenderModal
        open={showRender}
        onClose={() => setShowRender(false)}
        onDownload4k={download4k}
        onSaveLocal={saveRenderLocal}
        isSavingRender={isSavingRender}
        capture4kRef={capture4kRef}
        cameraCanvasGl={cameraViewGl}
        sceneProps={{
          ...renderSceneProps,
          postFxQuality: mainPostFxHeavy ? 'balanced' : 'high',
        }}
      />

      <TopViewModal
        open={showTopView}
        onClose={() => setShowTopView(false)}
        onDownload={() =>
          exportLightingDiagram({
            lights,
            subject,
            camera: cam,
            cameraSettings: { iso, shutter: shutterLabel, aperture, focalLength },
            lightLockSubject,
          })
        }
        sceneProps={{
          ...sceneProps,
          lights: exportViewLights,
          envBrightness: 1,
          giEnabled: false,
          diffuseEnabled: false,
          showRulers: false,
          showSubjectControlFrame: false,
          selected: { type: 'none', id: '' },
          setSelected: () => {},
          setDragging: () => {},
          updateFlag: () => {},
          lockView: false,
        }}
      />
    </div>
  )
}

useGLTF.preload(DEFAULT_MODEL_URL)
