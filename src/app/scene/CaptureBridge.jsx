import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector2 } from 'three'

const CAPTURE_WIDTH = 4500
const CAPTURE_HEIGHT = 3000
const waitFrames = (count = 2) =>
  new Promise((resolve) => {
    let left = Math.max(1, count)
    const step = () => {
      left -= 1
      if (left <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })

export function CaptureBridge({ onReady, toneMappingExposure }) {
  const { gl, invalidate } = useThree()

  useEffect(() => {
    onReady(async () => {
      const prevSize = gl.getSize(new Vector2())
      const prevRatio = gl.getPixelRatio()
      const prevExposure = gl.toneMappingExposure

      if (Number.isFinite(toneMappingExposure)) {
        gl.toneMappingExposure = toneMappingExposure
      }
      gl.setPixelRatio(1)
      gl.setSize(CAPTURE_WIDTH, CAPTURE_HEIGHT, false)
      invalidate()
      await waitFrames(2)
      const data = gl.domElement.toDataURL('image/png')

      gl.setPixelRatio(prevRatio)
      gl.setSize(prevSize.x, prevSize.y, false)
      gl.toneMappingExposure = prevExposure
      invalidate()
      await waitFrames(1)
      return data
    })
  }, [gl, invalidate, onReady, toneMappingExposure])

  return null
}
