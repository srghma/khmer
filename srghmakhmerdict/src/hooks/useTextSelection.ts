import { useState, useEffect, useCallback } from 'react'
import { calculateMenuPosition, getSafeRange, isSelectionInsideRef, type Position } from '../utils/selectionUtils'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface UseTextSelectionReturn {
  visible: boolean
  setVisible: (v: boolean) => void
  position: Position
  selectedText?: NonEmptyStringTrimmed
  clearSelection: () => void
  useFullWidth: boolean
}

export function useTextSelection(containerRef?: React.RefObject<HTMLElement | null>): UseTextSelectionReturn {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState<NonEmptyStringTrimmed>()
  const [useFullWidth, setUseFullWidth] = useState(false)

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setVisible(false)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleSelectionChange = () => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        const selection = window.getSelection()
        const range = getSafeRange(selection)

        if (!selection || !range) {
          setVisible(false)

          return
        }

        const text = selection.toString().trim()

        if (!text) {
          setVisible(false)

          return
        }

        if (containerRef?.current) {
          const isInside = isSelectionInsideRef(selection, containerRef.current)

          if (!isInside) {
            setVisible(false)

            return
          }
        }

        const rect = range.getBoundingClientRect()

        if (rect.width === 0 && rect.height === 0) {
          setVisible(false)

          return
        }

        const isMobile = window.innerWidth < 640
        const shouldUseFullWidth = isMobile
        const newPos = calculateMenuPosition(rect, window, undefined, undefined, shouldUseFullWidth)

        setSelectedText(String_toNonEmptyString_orUndefined_afterTrim(text))
        setPosition(newPos)
        setUseFullWidth(shouldUseFullWidth)
        setVisible(true)
      }, 300)
    }

    // --- INTERACTION HANDLERS ---

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement

      // IGNORE clicks inside our popup
      if (target.closest('[data-selection-popup="true"]')) return
      setVisible(false)
    }

    const handlePointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement

      // IGNORE release events from our popup (e.g. finishing a drag)
      // This prevents the hook from overwriting the popup's state on drag release
      if (target.closest('[data-selection-popup="true"]')) return

      handleSelectionChange()
    }

    const handleInteract = () => {
      // Optional: hide on scroll
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('resize', handleInteract)
    window.addEventListener('scroll', handleInteract, true)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('resize', handleInteract)
      window.removeEventListener('scroll', handleInteract, true)
      clearTimeout(timeoutId)
    }
  }, [containerRef])

  return { visible, setVisible, position, selectedText, clearSelection, useFullWidth }
}
