import {
  CTO_LEVELS,
  GRID_ANGLES,
  MODIFIERS,
  POWER_HEAD_OPTIONS,
  POWER_LABELS,
  POWER_VALUES,
} from '../config/constants'
import { findAccessory } from '../utils/lightingMath'

export function RightInspector({
  lights,
  selected,
  setSelected,
  selectedGroupLabel,
  collapsed,
  setCollapsed,
  updateLight,
  triggerShutter,
  triggerLightTest,
  removeAccessory,
  removeLight,
}) {
  return (
    <aside className="w-80 border-l border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold tracking-wide text-zinc-100">引闪器设置 ({selectedGroupLabel})</h2>
      <p className="mt-1 text-xs text-zinc-400">每组可折叠，点击标题展开/收起。</p>

      <div className="mt-4 space-y-3 overflow-auto pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {lights.map((light) => {
          const powerFactor = POWER_VALUES[light.powerIndex] ?? 1
          const maxWs = Math.max(0, Number(light.maxWs ?? light.headWs ?? 0))
          const flashWs = maxWs * powerFactor
          const continuousW = (light.continuousW ?? maxWs) * powerFactor
          const modelingBaseW = maxWs / 10
          const modelingPower = Math.max(0, Math.min(modelingBaseW, Number(light.modelingPower ?? modelingBaseW)))
          const isCollapsed = collapsed[light.id] ?? false
          const isSelected = selected.type === 'light' && selected.id === light.id
          const beamShapeValue = ['focused', 'standard'].includes(light.beamShape) ? light.beamShape : 'standard'

          return (
            <div
              key={light.id}
              className={`rounded-xl border ${isSelected ? 'border-cyan-500/60 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/70'}`}
            >
              <button
                type="button"
                onClick={() => {
                  setSelected({ type: 'light', id: light.id })
                  setCollapsed((state) => ({ ...state, [light.id]: !isCollapsed }))
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold">{light.group}</span>
                <span className="text-xs text-zinc-400">{isCollapsed ? '展开' : '折叠'}</span>
              </button>

              {!isCollapsed ? (
                <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
                  <div className="mb-2 text-xs text-zinc-500">
                    当前输出: {light.mode === 'flash' ? `${flashWs.toFixed(1)}Ws` : `${continuousW.toFixed(1)}W`}
                  </div>
                  <div className="mb-2 text-[11px] text-zinc-500">说明: `Ws` 是闪光能量，`W` 是常亮持续功率。</div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateLight(light.id, { mode: 'continuous' })}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${light.mode === 'continuous' ? 'border-amber-400 bg-amber-400/20 text-amber-200' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}
                    >
                      ☀️ 常亮
                    </button>
                    <button
                      onClick={() => updateLight(light.id, { mode: 'flash' })}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${light.mode === 'flash' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}
                    >
                      ⚡ 闪光
                    </button>
                  </div>

                  <div className="mb-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-xs">
                    <span className="text-zinc-400">灯组开关</span>
                    <button
                      onClick={() => updateLight(light.id, { enabled: !light.enabled })}
                      className={`rounded px-2 py-1 font-semibold ${light.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {light.enabled ? '开启' : '关闭'}
                    </button>
                  </div>

                  <div className="mb-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-xs">
                    <span className="text-zinc-400">中心红线 / 蓝色范围</span>
                    <button
                      onClick={() => updateLight(light.id, { showGuide: !light.showGuide })}
                      className={`rounded px-2 py-1 font-semibold ${light.showGuide ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {light.showGuide ? '显示' : '隐藏'}
                    </button>
                  </div>

                  <label className="mb-3 block rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-xs text-zinc-400">
                    中心亮边缘暗 {(light.edgeFalloff ?? 0).toFixed(2)}（0 = 光线均匀）
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={light.edgeFalloff ?? 0}
                      onChange={(e) => updateLight(light.id, { edgeFalloff: Number(e.target.value) })}
                      className="mt-1 w-full accent-cyan-500"
                    />
                  </label>

                  <label className="block text-xs text-zinc-400">
                    {light.mode === 'flash' ? '闪光头功率 (Ws)' : '常亮灯功率 (W)'}
                  </label>
                  <select
                    value={light.mode === 'flash' ? light.headWs : (light.continuousW ?? light.headWs)}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      if (light.mode === 'flash') updateLight(light.id, { headWs: next })
                      else updateLight(light.id, { continuousW: next })
                    }}
                    className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
                  >
                    {POWER_HEAD_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {light.mode === 'flash' ? `${item}Ws` : `${item}W`}
                      </option>
                    ))}
                  </select>

                  <label className="mt-3 block text-xs text-zinc-400">
                    {light.mode === 'flash' ? '闪光档位' : '常亮调光档位'}
                  </label>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>1/1</span>
                    <span>1/4</span>
                    <span>1/128</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={POWER_LABELS.length - 1}
                    step={1}
                    value={light.powerIndex}
                    onChange={(e) => updateLight(light.id, { powerIndex: Number(e.target.value) })}
                    className="mt-2 w-full accent-cyan-500"
                  />
                  <div className="mt-1 text-xs text-zinc-500">当前档位: {POWER_LABELS[light.powerIndex]}</div>

                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">造型灯</span>
                      <button
                        onClick={() => updateLight(light.id, { modelingOn: !light.modelingOn })}
                        className={`h-6 w-12 rounded-full p-1 ${light.modelingOn ? 'bg-cyan-500' : 'bg-zinc-700'}`}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white ${light.modelingOn ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      上限固定 = 闪光头最大功率 1/10（{modelingBaseW.toFixed(1)}W）
                    </div>
                    <label className="mt-2 block text-xs text-zinc-400">
                      造型灯功率 {modelingPower.toFixed(1)}W / {modelingBaseW.toFixed(1)}W
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={modelingBaseW}
                      step={0.1}
                      value={modelingPower}
                      onChange={(e) => updateLight(light.id, { modelingPower: Number(e.target.value) })}
                      className="mt-1 w-full accent-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (triggerLightTest) triggerLightTest(light.id)
                      else triggerShutter(false)
                    }}
                    className="mt-3 w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-zinc-950"
                  >
                    TEST 试闪
                  </button>

                  <label className="mt-3 block text-xs text-zinc-400">附件选择 (Modifiers)</label>
                  <select
                    value={light.modifier}
                    onChange={(e) => updateLight(light.id, { modifier: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
                  >
                    {MODIFIERS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {['softbox_rect', 'softbox_strip_30120'].includes(light.modifier) ? (
                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                      <label className="block text-xs text-zinc-400">光束形态</label>
                      <select
                        value={beamShapeValue}
                        onChange={(e) => updateLight(light.id, { beamShape: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
                      >
                        <option value="standard">默认 (Standard)</option>
                        <option value="focused">金字塔 (Focused)</option>
                      </select>

                      {beamShapeValue === 'focused' ? (
                        <>
                          <label className="mt-3 block text-xs text-zinc-400">
                            聚焦约束度 {(light.focusConstraint ?? 0.35).toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={light.focusConstraint ?? 0.35}
                            onChange={(e) => updateLight(light.id, { focusConstraint: Number(e.target.value) })}
                            className="mt-1 w-full accent-cyan-500"
                          />
                        </>
                      ) : null}

                      {light.modifier === 'softbox_rect' ? (
                        <>
                          <label className="mt-3 block text-xs text-zinc-400">
                            柔光箱宽度 {(light.rectWidth ?? 1.7).toFixed(2)}m
                          </label>
                          <input
                            type="range"
                            min={0.3}
                            max={3}
                            step={0.01}
                            value={light.rectWidth ?? 1.7}
                            onChange={(e) => updateLight(light.id, { rectWidth: Number(e.target.value) })}
                            className="mt-1 w-full accent-cyan-500"
                          />

                          <label className="mt-3 block text-xs text-zinc-400">
                            柔光箱高度 {(light.rectHeight ?? 1.1).toFixed(2)}m
                          </label>
                          <input
                            type="range"
                            min={0.3}
                            max={3}
                            step={0.01}
                            value={light.rectHeight ?? 1.1}
                            onChange={(e) => updateLight(light.id, { rectHeight: Number(e.target.value) })}
                            className="mt-1 w-full accent-cyan-500"
                          />
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                    <div className="mb-1 text-xs text-zinc-400">附加附件</div>
                    {light.accessories.map((id) => {
                      const acc = findAccessory(id)
                      if (!acc) return null
                      return (
                        <div key={acc.id} className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1 text-xs">
                          <span>{acc.label}</span>
                          <button onClick={() => removeAccessory(light.id, acc.id)} className="text-rose-300">
                            移除
                          </button>
                        </div>
                      )
                    })}
                    {!light.accessories.length ? <div className="text-xs text-zinc-500">暂无</div> : null}
                  </div>

                  {light.accessories.includes('grid') ? (
                    <label className="mt-3 block text-xs text-zinc-400">
                      格栅角度
                      <select
                        value={light.gridAngle || 20}
                        onChange={(e) => updateLight(light.id, { gridAngle: Number(e.target.value) })}
                        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
                      >
                        {GRID_ANGLES.map((item) => (
                          <option key={item} value={item}>
                            {item}°
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {light.accessories.includes('cto') ? (
                    <label className="mt-3 block text-xs text-zinc-400">
                      CTO 色片等级
                      <select
                        value={light.ctoLevel || '1/1'}
                        onChange={(e) => updateLight(light.id, { ctoLevel: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs"
                      >
                        {CTO_LEVELS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <button
                    onClick={() => removeLight(light.id)}
                    className="mt-3 w-full rounded border border-rose-500/40 bg-rose-500/10 py-2 text-xs text-rose-300"
                  >
                    移除灯光
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
