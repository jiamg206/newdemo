import { APERTURE_OPTIONS, ISO_OPTIONS, SHUTTER_OPTIONS } from '../config/constants'

export function TopBar({
  iso,
  setIso,
  shutterSpeed,
  setShutterSpeed,
  aperture,
  setAperture,
  focalLength,
  setFocalLength,
  envBrightness,
  setEnvBrightness,
  giEnabled,
  setGiEnabled,
  diffuseEnabled,
  setDiffuseEnabled,
  lightLockSubject,
  setLightLockSubject,
  renderCount,
  onTriggerShutter,
  onOpenRender,
  onOpenTopView,
}) {
  return (
    <header className="flex h-[68px] items-center justify-between border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-5 shadow-lg shadow-black/30">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-lg">
          <img
            src="/studio-logo.png"
            alt="logo"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest">余弦的布光室</p>
          <p className="text-[11px] text-zinc-400">Powered by Gemini&Gpt-5.3-Codex&Codex</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/90 p-2">
        <label className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">
          ISO
          <select value={iso} onChange={(e) => setIso(Number(e.target.value))} className="ml-2 bg-transparent">
            {ISO_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">
          快门
          <select value={shutterSpeed} onChange={(e) => setShutterSpeed(Number(e.target.value))} className="ml-2 bg-transparent">
            {SHUTTER_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">
          光圈
          <select value={aperture} onChange={(e) => setAperture(Number(e.target.value))} className="ml-2 bg-transparent">
            {APERTURE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                f/{item}
              </option>
            ))}
          </select>
        </label>

        <label className="w-44 rounded-lg bg-zinc-800 px-3 py-2 text-xs">
          焦段 {focalLength}mm
          <input
            type="range"
            min={14}
            max={200}
            value={focalLength}
            onChange={(e) => setFocalLength(Number(e.target.value))}
            className="mt-1 w-full accent-cyan-500"
          />
        </label>

        <label className="w-44 rounded-lg bg-zinc-800 px-3 py-2 text-xs">
          环境初始亮度 {envBrightness.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.01}
            value={envBrightness}
            onChange={(e) => setEnvBrightness(Number(e.target.value))}
            className="mt-1 w-full accent-emerald-500"
          />
        </label>

        <button
          onClick={() => setLightLockSubject((v) => !v)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${lightLockSubject ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-700 text-zinc-200'}`}
        >
          灯光锁定人物 {lightLockSubject ? '开' : '关'}
        </button>
        <button
          onClick={() => setGiEnabled((v) => !v)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${giEnabled ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-700 text-zinc-200'}`}
        >
          全局光照 {giEnabled ? '开' : '关'}
        </button>
        <button
          onClick={() => setDiffuseEnabled((v) => !v)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${diffuseEnabled ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-700 text-zinc-200'}`}
        >
          漫反射 {diffuseEnabled ? '开' : '关'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">本地图集 {renderCount}</span>
        <button onClick={onTriggerShutter} className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold">
          快门测试
        </button>
        <button onClick={onOpenRender} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950">
          渲染出图
        </button>
        <button onClick={onOpenTopView} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">
          导出方案
        </button>
      </div>
    </header>
  )
}
