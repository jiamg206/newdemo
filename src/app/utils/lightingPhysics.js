import { POWER_VALUES } from '../config/constants'
import { clamp, findModifier } from './lightingMath'

export const LUMINOUS_EFFICACY = 40
const DEFAULT_FRACTION = 1
const EPS = 1e-6

export const getFlashFraction = (light) => {
  if (Number.isFinite(light?.fraction)) return clamp(Number(light.fraction), 0, 1)
  return POWER_VALUES[light?.powerIndex] ?? DEFAULT_FRACTION
}

export const getPowerFactor = (light) => getFlashFraction(light)

export const getMaxWs = (light) => Math.max(0, Number(light?.maxWs ?? light?.headWs ?? 0))

export const getFlashWs = (light) => getMaxWs(light) * getFlashFraction(light)

export const wsToLumens = (ws, luminousEfficacy = LUMINOUS_EFFICACY) =>
  Math.max(0, Number(ws) || 0) * Math.max(0, Number(luminousEfficacy) || 0)

export const getFlashLumens = (light, luminousEfficacy = LUMINOUS_EFFICACY) =>
  wsToLumens(getFlashWs(light), luminousEfficacy)

export const beamAngleToSteradians = (fullAngleRad) => {
  const angle = clamp(Number(fullAngleRad) || Math.PI / 3, 1e-4, Math.PI)
  const half = angle / 2
  return 2 * Math.PI * (1 - Math.cos(half))
}

export const lumensToCandela = (lumens, steradians = 4 * Math.PI) =>
  Math.max(0, Number(lumens) || 0) / Math.max(EPS, Number(steradians) || 0)

export const getFlashCandela = (
  light,
  { beamAngleRad = Math.PI / 3, luminousEfficacy = LUMINOUS_EFFICACY } = {},
) => lumensToCandela(getFlashLumens(light, luminousEfficacy), beamAngleToSteradians(beamAngleRad))

export function resolveFlashPhotometry(
  light,
  { beamAngleRad = Math.PI / 3, luminousEfficacy = LUMINOUS_EFFICACY } = {},
) {
  const maxWs = getMaxWs(light)
  const fraction = getFlashFraction(light)
  const actualWs = maxWs * fraction
  const actualLumens = wsToLumens(actualWs, luminousEfficacy)
  const steradians = beamAngleToSteradians(beamAngleRad)
  const actualCandela = lumensToCandela(actualLumens, steradians)

  return {
    maxWs,
    fraction,
    actualWs,
    actualLumens,
    actualCandela,
    steradians,
  }
}

export const getContinuousW = (light) =>
  light.mode === 'continuous' ? (light.continuousW ?? light.maxWs ?? light.headWs) * getPowerFactor(light) : 0

export const getModelingMaxW = (light) => getMaxWs(light) / 10

export const getModelingW = (light) => {
  if (!light.modelingOn || light.mode !== 'flash') return 0
  const maxModelingW = getModelingMaxW(light)
  return clamp(light.modelingPower ?? maxModelingW, 0, maxModelingW)
}

const isFlashTargeted = (light, flashTargets) => {
  if (!Array.isArray(flashTargets) || flashTargets.length === 0) return true
  return flashTargets.includes(light.id)
}

export const getFlashPulseWs = (light, isFlashing, flashTargets = null) =>
  light.mode === 'flash' && isFlashing && isFlashTargeted(light, flashTargets) ? getFlashWs(light) : 0

export const getTotalOutput = (light, isFlashing, flashTargets = null) =>
  getContinuousW(light) + getFlashPulseWs(light, isFlashing, flashTargets) + getModelingW(light)

export function computeSceneBounceBrightness({
  lights,
  isFlashing,
  flashTargets,
  sceneSettings,
  envBrightness,
  diffuseEnabled,
  bounceGain = 0.001,
}) {
  if (!diffuseEnabled) return clamp(envBrightness, 0, 2.8)

  const wallReflect = sceneSettings.enabled ? (sceneSettings.wallTone === 'white' ? 1.18 : 1.05) : 0.72
  const boundaryScale = clamp((sceneSettings.width * sceneSettings.depth) / 180, 0.8, 1.8)

  const lightEnergy = lights.reduce((sum, light) => {
    if (!light.enabled) return sum
    const modifier = findModifier(light.modifier)
    const modifierLoss = Math.pow(2, -(modifier.loss || 0))
    return sum + getTotalOutput(light, isFlashing, flashTargets) * modifierLoss
  }, 0)

  const bounce = lightEnergy * bounceGain * wallReflect * boundaryScale
  return clamp(envBrightness + bounce, 0, 2.8)
}
