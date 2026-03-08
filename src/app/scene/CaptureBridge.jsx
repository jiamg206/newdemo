import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector2 } from 'three'

const CAPTURE_WIDTH = 4500
const CAPTURE_HEIGHT = 3000

export function CaptureBridge({ onReady }) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    onReady(async () => {
      const prevSize = gl.getSize(new Vector2())
      const prevRatio = gl.getPixelRatio()

      gl.setPixelRatio(1)
      gl.setSize(CAPTURE_WIDTH, CAPTURE_HEIGHT, false)
      gl.render(scene, camera)
      const data = gl.domElement.toDataURL('image/png')
      gl.setPixelRatio(prevRatio)
      gl.setSize(prevSize.x, prevSize.y, false)
      gl.render(scene, camera)
      return data
    })
  }, [gl, scene, camera, onReady])

  return null
}
