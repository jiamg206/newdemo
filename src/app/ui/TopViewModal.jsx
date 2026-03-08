import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { StudioScene } from '../scene/StudioScene'

export function TopViewModal({ open, onClose, onDownload, sceneProps }) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[980px] rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">布光顶视图（导出方案）</h3>
          <div className="flex items-center gap-2">
            <button onClick={onDownload} className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950">
              导出方案图
            </button>
            <button onClick={onClose} className="rounded bg-zinc-800 px-3 py-1 text-xs">
              关闭
            </button>
          </div>
        </div>

        <div className="h-[560px] overflow-hidden rounded-xl border border-zinc-800">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1,
              outputColorSpace: SRGBColorSpace,
              useLegacyLights: false,
            }}
            className="h-full w-full"
          >
            <StudioScene {...sceneProps} viewMode="top" interactive={false} highQuality={false} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
