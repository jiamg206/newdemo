import { useEffect, useRef } from 'react'
import { clamp } from '../utils/lightingMath'

export function useManipulator(transform, onUpdate, onDrag, options = {}) {
  const dragRef = useRef(null)
  const rafRef = useRef(0)
  const pendingRef = useRef(null)
  const wheelLockTimerRef = useRef(0)

  const wheelMode = options.wheelMode || 'height'
  const enabled = options.enabled ?? true
  const minY = options.minY ?? 0.1
  const maxY = options.maxY ?? Infinity
  const minScale = options.minScale ?? 0.2
  const maxScale = options.maxScale ?? Infinity

  const apply = (patch) => {
    pendingRef.current = patch
    if (rafRef.current) return

    rafRef.current = requestAnimationFrame(() => {
      if (pendingRef.current) onUpdate(pendingRef.current)
      pendingRef.current = null
      rafRef.current = 0
    })
  }

  const lockOnWheel = () => {
    onDrag(true)
    if (wheelLockTimerRef.current) clearTimeout(wheelLockTimerRef.current)
    wheelLockTimerRef.current = setTimeout(() => onDrag(false), 160)
  }

  const onPointerDown = (e) => {
    if (!enabled) return
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      startPos: [...transform.position],
      startRot: [...transform.rotation],
      mode: e.altKey ? 'elevate' : e.shiftKey || e.button === 2 ? 'rotate' : 'move',
    }
    onDrag(true)
  }

  const onPointerMove = (e) => {
    if (!enabled) return
    const drag = dragRef.current
    if (!drag) return

    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy

    if (drag.mode === 'move') {
      apply({
        position: [drag.startPos[0] + dx * 0.008, drag.startPos[1], drag.startPos[2] + dy * 0.008],
      })
      return
    }

    if (drag.mode === 'elevate') {
      apply({
        position: [drag.startPos[0], clamp(drag.startPos[1] - dy * 0.01, minY, maxY), drag.startPos[2]],
      })
      return
    }

    apply({
      rotation: [clamp(drag.startRot[0] + dy * 0.0045, -1.2, 1.2), drag.startRot[1] + dx * 0.0055, 0],
    })
  }

  const onPointerUp = () => {
    dragRef.current = null
    onDrag(false)
  }

  const onWheel = (e) => {
    if (!enabled) return
    e.stopPropagation()
    lockOnWheel()

    if (wheelMode === 'scale') {
      const scaleValue = typeof transform.scale === 'number' ? transform.scale : 1
      const next = clamp(scaleValue - e.deltaY * 0.0018, minScale, maxScale)
      apply({ scale: next })
      return
    }

    apply({
      position: [
        transform.position[0],
        clamp(transform.position[1] - e.deltaY * 0.0015, minY, maxY),
        transform.position[2],
      ],
    })
  }

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (wheelLockTimerRef.current) clearTimeout(wheelLockTimerRef.current)
    },
    [],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onWheel,
  }
}
