import { BrightnessContrast, N8AO } from '@react-three/postprocessing'

export function SSGI({
  distance = 10,
  thickness = 10,
  maxRoughness = 1,
  blend = 0.9,
  enableGI = true,
  enableDiffuse = true,
  quality = 'high',
}) {
  const balanced = quality === 'balanced'
  const aoRadius = Math.max(0.25, Math.min(2.1, distance * (balanced ? 0.1 : 0.14)))
  const aoIntensity = Math.max(0.08, Math.min(0.4, (1 - maxRoughness * 0.35) * (balanced ? 0.24 : 0.35)))
  const diffuseContrast = Math.max(
    balanced ? -0.01 : -0.014,
    Math.min(-0.002, -0.002 - blend * (balanced ? 0.005 : 0.008) - thickness * 0.00008),
  )

  return (
    <>
      {enableGI ? (
        <N8AO
          aoRadius={aoRadius}
          intensity={aoIntensity}
          distanceFalloff={1}
          screenSpaceRadius={!balanced}
        />
      ) : null}
      {enableDiffuse ? <BrightnessContrast brightness={0} contrast={diffuseContrast} /> : null}
    </>
  )
}
