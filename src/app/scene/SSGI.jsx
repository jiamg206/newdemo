import { BrightnessContrast, N8AO } from '@react-three/postprocessing'

export function SSGI({
  distance = 10,
  thickness = 10,
  maxRoughness = 1,
  blend = 0.9,
  enableGI = true,
  enableDiffuse = true,
}) {
  const aoRadius = Math.max(0.35, Math.min(2.4, distance * 0.14))
  const aoIntensity = Math.max(0.12, Math.min(0.45, (1 - maxRoughness * 0.35) * 0.35))
  const diffuseContrast = Math.max(-0.014, Math.min(-0.002, -0.002 - blend * 0.008 - thickness * 0.00008))

  return (
    <>
      {enableGI ? <N8AO aoRadius={aoRadius} intensity={aoIntensity} distanceFalloff={1} screenSpaceRadius /> : null}
      {enableDiffuse ? <BrightnessContrast brightness={0} contrast={diffuseContrast} /> : null}
    </>
  )
}
