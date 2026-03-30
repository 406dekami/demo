import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject, type WheelEvent as ReactWheelEvent } from 'react'

const MIN_SCALE = 0.3
const MAX_SCALE = 2.5
const INITIAL_VIEW = { x: 48, y: 72, scale: 1 }

type UseMindMapViewportArgs = {
  viewportRef: RefObject<HTMLDivElement | null>
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const useMindMapViewport = ({ viewportRef }: UseMindMapViewportArgs) => {
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [view, setView] = useState(INITIAL_VIEW)

  const applyZoom = useCallback((clientX: number, clientY: number, delta: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = clientX - rect.left
    const py = clientY - rect.top

    setView((prev) => {
      const scale = clamp(Number((prev.scale + delta).toFixed(2)), MIN_SCALE, MAX_SCALE)
      if (scale === prev.scale) return prev
      const worldX = (px - prev.x) / prev.scale
      const worldY = (py - prev.y) / prev.scale
      return { scale, x: px - worldX * scale, y: py - worldY * scale }
    })
  }, [viewportRef])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    applyZoom(event.clientX, event.clientY, event.deltaY > 0 ? -0.12 : 0.12)
  }, [applyZoom])

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-node="1"]')) return
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    }
  }, [view.x, view.y])

  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const { startX, startY, originX, originY } = dragRef.current
    setView((prev) => ({ ...prev, x: originX + event.clientX - startX, y: originY + event.clientY - startY }))
  }, [])

  const stopDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  const zoomByButton = useCallback((delta: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    applyZoom(rect.left + rect.width / 2, rect.top + rect.height / 2, delta)
  }, [applyZoom, viewportRef])

  const resetView = useCallback(() => {
    setView(INITIAL_VIEW)
  }, [])

  return {
    view,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    stopDrag,
    zoomByButton,
    resetView,
  }
}
