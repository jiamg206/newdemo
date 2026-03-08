import { ACCESSORIES, TABS } from '../config/constants'

const LIGHT_PRESETS = [100, 200, 400, 600, 1200]

export function LeftSidebar({
  activeTab,
  setActiveTab,
  modelUrl,
  fileInputRef,
  onImportModel,
  loadDefaultModel,
  addLight,
  sceneSettings,
  setSceneSettings,
  showRulers,
  setShowRulers,
  flags,
  addFlag,
  updateFlag,
  removeFlag,
  newAccessoryId,
  setNewAccessoryId,
  addAccessory,
}) {
  return (
    <aside className="w-[300px] border-r border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-900 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-2 py-2 text-xs ${activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === TABS[0] ? (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-left text-sm hover:border-cyan-400"
          >
            添加模特（导入 .glb / .gltf）
          </button>
          <button
            onClick={loadDefaultModel}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-left text-sm hover:border-cyan-400"
          >
            使用默认模特（Animated.gltf）
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,model/gltf+json,model/gltf-binary"
            onChange={onImportModel}
            className="hidden"
          />
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-400">
            当前模型: {modelUrl}
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-[11px] text-zinc-500">
            先点击物体出现蓝框，再进行拖动、旋转或滚轮调节。
          </div>
        </div>
      ) : activeTab === TABS[1] ? (
        <div className="grid grid-cols-2 gap-3">
          {LIGHT_PRESETS.map((ws) => (
            <button
              key={ws}
              onClick={() => addLight(ws)}
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 text-xs"
            >
              <span>●</span>
              <span>添加 {ws}Ws 闪光灯</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-xs text-zinc-300">场景边界</p>
            <button
              onClick={() => setShowRulers((value) => !value)}
              className={`mt-2 w-full rounded border px-2 py-2 text-xs font-semibold ${
                showRulers ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200' : 'border-zinc-700 bg-zinc-900 text-zinc-300'
              }`}
            >
              标尺辅助 {showRulers ? '开启' : '关闭'}
            </button>
            <label className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>启用边界墙</span>
              <input
                type="checkbox"
                checked={sceneSettings.enabled}
                onChange={(e) => setSceneSettings((s) => ({ ...s, enabled: e.target.checked }))}
              />
            </label>
            <label className="mt-2 block text-xs text-zinc-400">
              墙体颜色
              <select
                value={sceneSettings.wallTone}
                onChange={(e) => setSceneSettings((s) => ({ ...s, wallTone: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
              >
                <option value="gray">浅灰墙</option>
                <option value="white">白墙</option>
              </select>
            </label>
            <label className="mt-2 block text-xs text-zinc-400">
              边界宽度 {sceneSettings.width.toFixed(1)}m
              <input
                type="range"
                min={6}
                max={26}
                step={0.2}
                value={sceneSettings.width}
                onChange={(e) => setSceneSettings((s) => ({ ...s, width: Number(e.target.value) }))}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>
            <label className="mt-2 block text-xs text-zinc-400">
              边界深度 {sceneSettings.depth.toFixed(1)}m
              <input
                type="range"
                min={6}
                max={26}
                step={0.2}
                value={sceneSettings.depth}
                onChange={(e) => setSceneSettings((s) => ({ ...s, depth: Number(e.target.value) }))}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>
            <label className="mt-2 block text-xs text-zinc-400">
              天花板高度 {sceneSettings.ceilingHeight.toFixed(1)}m
              <input
                type="range"
                min={2.2}
                max={8}
                step={0.1}
                value={sceneSettings.ceilingHeight}
                onChange={(e) => setSceneSettings((s) => ({ ...s, ceilingHeight: Number(e.target.value) }))}
                className="mt-1 w-full accent-cyan-500"
              />
            </label>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-xs text-zinc-300">摄影旗板</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => addFlag('black')} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs">
                添加黑旗
              </button>
              <button onClick={() => addFlag('white')} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs">
                添加白旗
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {flags.map((flag) => (
                <div key={flag.id} className="rounded border border-zinc-800 bg-zinc-900 p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{flag.type === 'black' ? '黑旗' : '白旗'}</span>
                    <button onClick={() => removeFlag(flag.id)} className="text-rose-300">
                      移除
                    </button>
                  </div>
                  <label className="mt-1 block text-[11px] text-zinc-400">
                    宽 {flag.width.toFixed(2)}m
                    <input
                      type="range"
                      min={0.3}
                      max={2.5}
                      step={0.05}
                      value={flag.width}
                      onChange={(e) => updateFlag(flag.id, { width: Number(e.target.value) })}
                      className="w-full"
                    />
                  </label>
                  <label className="mt-1 block text-[11px] text-zinc-400">
                    高 {flag.height.toFixed(2)}m
                    <input
                      type="range"
                      min={0.2}
                      max={3}
                      step={0.05}
                      value={flag.height}
                      onChange={(e) => updateFlag(flag.id, { height: Number(e.target.value) })}
                      className="w-full"
                    />
                  </label>
                </div>
              ))}
              {!flags.length ? <div className="text-xs text-zinc-500">暂无旗板</div> : null}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="text-xs text-zinc-300">灯光附件（当前灯）</p>
            <div className="mt-2 flex gap-2">
              <select
                value={newAccessoryId}
                onChange={(e) => setNewAccessoryId(e.target.value)}
                className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
              >
                {ACCESSORIES.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addAccessory(newAccessoryId)}
                className="rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
