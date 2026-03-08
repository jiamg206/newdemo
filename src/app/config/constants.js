export const TABS = ['模特', '灯光', '场景设置']

export const POWER_LABELS = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128', '1/256']
export const POWER_VALUES = [1, 0.5, 0.25, 0.125, 1 / 16, 1 / 32, 1 / 64, 1 / 128, 1 / 256]
export const POWER_HEAD_OPTIONS = [100, 200, 400, 600, 1200]

export const ISO_OPTIONS = [100, 200, 400, 800, 1600]
export const SHUTTER_OPTIONS = [
  { label: '1/30', value: 1 / 30 },
  { label: '1/60', value: 1 / 60 },
  { label: '1/125', value: 1 / 125 },
  { label: '1/200', value: 1 / 200 },
  { label: '1/250', value: 1 / 250 },
  { label: '1/500', value: 1 / 500 },
]
export const APERTURE_OPTIONS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16]

export const MODIFIERS = [
  {
    id: 'bare_bulb',
    label: '裸灯管',
    kind: 'spot',
    angle: Math.PI / 2,
    penumbra: 0.1,
    loss: 0.05,
  },
  {
    id: 'standard_reflector',
    label: '标准罩',
    kind: 'spot',
    angle: Math.PI / 4,
    penumbra: 0.3,
    loss: 0.2,
  },
  {
    id: 'deep_parabolic_90',
    label: '90cm 深抛',
    kind: 'spot',
    angle: 0.38,
    penumbra: 0.18,
    loss: 0.35,
  },
  {
    id: 'deep_parabolic_120',
    label: '120cm 深抛',
    kind: 'spot',
    angle: 0.44,
    penumbra: 0.22,
    loss: 0.52,
  },
  {
    id: 'octabox_grid',
    label: '八角柔光箱+格栅',
    kind: 'spot',
    angle: 0.28,
    penumbra: 0.08,
    loss: 0.95,
  },
  {
    id: 'beauty_dish_55',
    label: '55cm 美人碟',
    kind: 'spot',
    angle: 0.62,
    penumbra: 0.28,
    loss: 0.4,
  },
  {
    id: 'snoot',
    label: '束光筒',
    kind: 'spot',
    angle: 0.15,
    penumbra: 0.05,
    loss: 1.15,
  },
  {
    id: 'softbox_rect',
    label: '自定义矩形柔光箱',
    kind: 'rect',
    width: 1.7,
    height: 1.1,
    loss: 0.75,
  },
  {
    id: 'softbox_strip_30120',
    label: '30x120 条形柔光箱',
    kind: 'rect',
    width: 0.45,
    height: 1.6,
    loss: 0.9,
  },
]

export const ACCESSORIES = [
  { id: 'grid', label: '蜂巢网格', loss: 0.7 },
  { id: 'barn', label: '挡光板', loss: 0.2 },
  { id: 'diff', label: '柔光布', loss: 0.5 },
  { id: 'cto', label: 'CTO 暖色片', loss: 0 },
  { id: 'ctb', label: 'CTB 冷色片', loss: 0.3 },
]

export const CTO_LEVELS = [
  { id: '1/1', label: 'CTO 1/1', kelvinShift: 1200, loss: 1.0 },
  { id: '3/4', label: 'CTO 3/4', kelvinShift: 900, loss: 0.75 },
  { id: '1/2', label: 'CTO 1/2', kelvinShift: 650, loss: 0.5 },
  { id: '1/4', label: 'CTO 1/4', kelvinShift: 350, loss: 0.25 },
]

export const GRID_ANGLES = [10, 20, 30]

export const DEFAULT_MODEL_URL = '/Animated.gltf'

export const EXPOSURE_BASE = 4600
export const FLASH_MS = 90
export const MODELING_W = 20
export const SUBJECT_DEFAULT_POS = [0, 0, 0]
