import { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'

const fragmentShader = /* glsl */ `
uniform float uExposure;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * max(uExposure, 0.0), inputColor.a);
}
`

class GlobalExposureEffectImpl extends Effect {
  constructor(exposure = 1) {
    super('GlobalExposureEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([['uExposure', new Uniform(exposure)]]),
    })
    this._exposure = exposure
  }

  set exposure(value) {
    this._exposure = Number.isFinite(value) ? value : 1
    this.uniforms.get('uExposure').value = this._exposure
  }

  get exposure() {
    return this._exposure
  }
}

export const GlobalExposureEffect = forwardRef(function GlobalExposureEffect(
  { exposure = 1 },
  ref,
) {
  const effect = useMemo(() => new GlobalExposureEffectImpl(exposure), [])
  effect.exposure = exposure
  return <primitive ref={ref} object={effect} dispose={null} />
})

