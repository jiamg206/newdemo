import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { CaptureBridge } from '../scene/CaptureBridge'
import { StudioScene } from '../scene/StudioScene'

export function RenderModal({
  open,
  onClose,
  onDownload4k,
  onSaveLocal,
  isSavingRender,
  capture4kRef,
  cameraCanvasGl,
  sceneProps,
}) {
  const [advancedQuality, setAdvancedQuality] = useState(false)
  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[980px] rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">渲染预览</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdvancedQuality((v) => !v)}
              className={`rounded px-3 py-1 text-xs font-semibold ${advancedQuality ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-200'}`}
            >
              {advancedQuality ? '高级模式（实验）' : '稳定模式'}
            </button>
            <button onClick={onSaveLocal} className="rounded bg-cyan-500 px-3 py-1 text-xs font-semibold text-zinc-950">
              {isSavingRender ? '保存中...' : '保存到本地作品库'}
            </button>
            <button onClick={onDownload4k} className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950">
              下载 4K PNG
            </button>
            <button onClick={onClose} className="rounded bg-zinc-800 px-3 py-1 text-xs">
              关闭
            </button>
          </div>
        </div>

        <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-zinc-800">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={
              cameraCanvasGl || {
                antialias: true,
                preserveDrawingBuffer: true,
                toneMapping: ACESFilmicToneMapping,
                outputColorSpace: SRGBColorSpace,
                useLegacyLights: false,
              }
            }
            className="h-full w-full"
          >
            <StudioScene {...sceneProps} viewMode="camera" interactive={false} highQuality={advancedQuality} />
            <CaptureBridge
              toneMappingExposure={sceneProps?.toneMappingExposure}
              onReady={(fn) => {
                if (capture4kRef) capture4kRef.current = fn
              }}
            />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
