import { POWER_VALUES } from '../config/constants'
import { getLookRotation } from './lightingMath'

function getLightOutputLabel(light) {
  const powerFactor = POWER_VALUES[light.powerIndex] ?? 1
  const maxWs = Math.max(0, Number(light.maxWs ?? light.headWs ?? 0))
  const flashWs = maxWs * powerFactor
  const continuousW = (light.continuousW ?? maxWs) * powerFactor
  return light.mode === 'flash' ? `${flashWs.toFixed(0)}Ws` : `${continuousW.toFixed(0)}W`
}

export function exportLightingDiagram({ lights, subject, camera, cameraSettings, lightLockSubject }) {
  const width = 1600
  const height = 1100
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cx = width * 0.5
  const cy = height * 0.56
  const scale = 95
  const worldTo2d = (x, z) => [cx + x * scale, cy + z * scale]

  ctx.fillStyle = '#0b0e13'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 1
  for (let x = -7; x <= 7; x += 1) {
    const [px] = worldTo2d(x, 0)
    ctx.beginPath()
    ctx.moveTo(px, 120)
    ctx.lineTo(px, height - 120)
    ctx.stroke()
  }
  for (let z = -4; z <= 6; z += 1) {
    const [, py] = worldTo2d(0, z)
    ctx.beginPath()
    ctx.moveTo(180, py)
    ctx.lineTo(width - 180, py)
    ctx.stroke()
  }

  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, height - 90)
  ctx.lineTo(width - 150, height - 90)
  ctx.stroke()
  for (let i = 0; i <= 12; i += 1) {
    const x = 150 + ((width - 300) / 12) * i
    ctx.beginPath()
    ctx.moveTo(x, height - 90)
    ctx.lineTo(x, height - (i % 2 === 0 ? 70 : 78))
    ctx.stroke()
  }
  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 14px Segoe UI'
  ctx.fillText('水平标尺 (m)', 150, height - 48)

  const [sx, sy] = worldTo2d(subject.position[0], subject.position[2])
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(sx, sy, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#93c5fd'
  ctx.font = '600 22px Segoe UI'
  ctx.fillText('模特', sx + 24, sy + 8)

  if (camera?.position) {
    const [cx2d, cy2d] = worldTo2d(camera.position[0], camera.position[2])
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx2d, cy2d)
    ctx.lineTo(sx, sy)
    ctx.stroke()

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(cx2d, cy2d, 11, 0, Math.PI * 2)
    ctx.fill()

    const cdx = camera.position[0] - subject.position[0]
    const cdz = camera.position[2] - subject.position[2]
    const camDist = Math.sqrt(cdx * cdx + cdz * cdz)
    const camYaw = ((camera.rotation?.[1] || 0) * 180) / Math.PI
    const camLabel = `相机: 距离 ${camDist.toFixed(2)}m | 高度 ${Number(camera.position[1]).toFixed(2)}m | 角度 ${camYaw.toFixed(1)}°`

    ctx.fillStyle = '#fef3c7'
    ctx.font = '500 17px Segoe UI'
    ctx.fillText(camLabel, cx2d + 16, cy2d + 8)
  }

  lights.forEach((light, i) => {
    const [lx, ly] = worldTo2d(light.position[0], light.position[2])
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.lineTo(sx, sy)
    ctx.stroke()

    ctx.fillStyle = '#22d3ee'
    ctx.beginPath()
    ctx.arc(lx, ly, 12, 0, Math.PI * 2)
    ctx.fill()

    const dx = light.position[0] - subject.position[0]
    const dz = light.position[2] - subject.position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const outputLabel = getLightOutputLabel(light)
    const rot = lightLockSubject
      ? getLookRotation(light.position, [subject.position[0], subject.position[1] + 1.2, subject.position[2]])
      : light.rotation
    const yaw = (rot[1] * 180) / Math.PI
    const label = `${light.group}: ${outputLabel} | 距离 ${dist.toFixed(2)}m | 高度 ${light.position[1].toFixed(2)}m | 角度 ${yaw.toFixed(1)}°`

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '500 18px Segoe UI'
    ctx.fillText(label, lx + 18, ly - 12 - i * 2)

    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2
    const iconX = lx - 20
    const iconY = ly - 22
    if (light.modifier.includes('softbox') || light.modifier.includes('strip')) {
      ctx.strokeRect(iconX, iconY, 18, light.modifier.includes('strip') ? 28 : 18)
    } else if (light.modifier.includes('umbrella')) {
      ctx.beginPath()
      ctx.arc(iconX + 9, iconY + 10, 9, Math.PI, 0)
      ctx.stroke()
    } else if (light.modifier.includes('beauty') || light.modifier.includes('deep')) {
      ctx.beginPath()
      ctx.arc(iconX + 9, iconY + 10, 8, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.strokeRect(iconX, iconY, 18, 18)
    }
  })

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '600 20px Segoe UI'
  ctx.fillText(
    `参数 ISO ${cameraSettings.iso} / ${cameraSettings.shutter} / f${cameraSettings.aperture} / ${cameraSettings.focalLength}mm`,
    180,
    70,
  )
  ctx.fillText('导出方案默认: 环境亮度 1.0，所有灯光关闭', 180, 100)

  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `lighting-diagram-${Date.now()}.png`
  a.click()
}
