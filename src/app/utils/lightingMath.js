import { Box3, Vector3 } from 'three'
import { ACCESSORIES, MODIFIERS } from '../config/constants'

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const findModifier = (id) => {
  if (id === 'softbox_rect_grid') {
    return MODIFIERS.find((item) => item.id === 'softbox_rect') || MODIFIERS[0]
  }
  return MODIFIERS.find((item) => item.id === id) || MODIFIERS[0]
}
export const findAccessory = (id) => ACCESSORIES.find((item) => item.id === id)

export function kelvinToRgb(kelvin) {
  const t = kelvin / 100
  let r = 255
  let g = t <= 66 ? 99.4708 * Math.log(t) - 161.1196 : 288.1222 * Math.pow(t - 60, -0.0755)
  let b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177 * Math.log(t - 10) - 305.0448
  if (t > 66) r = 329.6987 * Math.pow(t - 60, -0.1332)

  r = clamp(Math.round(r), 0, 255)
  g = clamp(Math.round(g), 0, 255)
  b = clamp(Math.round(b), 0, 255)
  return `rgb(${r}, ${g}, ${b})`
}

export function getLookRotation(from, to) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const yaw = Math.atan2(-dx, -dz)
  const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))
  return [pitch, yaw, 0]
}

export function normalizeModelTransform(root, targetHeight = 1.75) {
  const box = new Box3().setFromObject(root)
  if (box.isEmpty()) return

  const size = new Vector3()
  const center = new Vector3()
  box.getSize(size)
  box.getCenter(center)

  const sourceHeight = Math.max(size.y, 0.001)
  const scale = targetHeight / sourceHeight
  root.scale.setScalar(scale)
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
}
