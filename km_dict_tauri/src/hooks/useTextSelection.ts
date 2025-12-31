import { useState, useEffect, useCallback } from 'react'
import { calculateMenuPosition, getSafeRange, isSelectionInsideRef, type Position } from '../utils/selectionUtils'

interface UseTextSelectionReturn {
  visible: boolean
  setVisible: (v: boolean) => void
  position: Position
  selectedText: string
  clearSelection: () => void
}

export function useTextSelection(containerRef?: React.RefObject<HTMLElement | null>): UseTextSelectionReturn {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setVisible(false)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleSelectionChange = () => {
      // Debounce
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        const selection = window.getSelection()
        const range = getSafeRange(selection)

        // 1. Basic Validation (Range must exist and text must be non-empty)
        if (!selection || !range) {
          setVisible(false)

          return
        }

        const text = selection.toString().trim()

        if (!text) {
          setVisible(false)

          return
        }

        // 2. Scope Validation (If ref provided, must be inside)
        if (containerRef?.current) {
          const isInside = isSelectionInsideRef(selection, containerRef.current)

          if (!isInside) {
            setVisible(false)

            return
          }
        }

        // 3. Position Calculation
        const rect = range.getBoundingClientRect()

        // Handle invisible/detached elements
        if (rect.width === 0 && rect.height === 0) {
          setVisible(false)

          return
        }

        const viewport = {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        }

        // Pure calculation
        const newPos = calculateMenuPosition(rect, viewport)

        setSelectedText(text)
        setPosition(newPos)
        setVisible(true)
      }, 300)
    }

    // Optional: Hide immediately on interaction to prevent floating menu in wrong place
    const handleInteract = () => {
      // setVisible(false)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    window.addEventListener('resize', handleInteract)
    window.addEventListener('scroll', handleInteract, true)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      window.removeEventListener('resize', handleInteract)
      window.removeEventListener('scroll', handleInteract, true)
      clearTimeout(timeoutId)
    }
  }, [containerRef])

  return { visible, setVisible, position, selectedText, clearSelection }
}
