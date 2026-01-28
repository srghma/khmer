import { useRef, useCallback, useEffect } from 'react'

export const useDraggable = (hostElement: HTMLElement) => {
  const isDragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      const rect = hostElement.getBoundingClientRect()
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    [hostElement],
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      hostElement.style.bottom = 'auto'
      hostElement.style.right = 'auto'
      hostElement.style.left = `${e.clientX - offset.current.x}px`
      hostElement.style.top = `${e.clientY - offset.current.y}px`
    }

    const onMouseUp = () => {
      isDragging.current = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [hostElement])

  return { onMouseDown }
}
