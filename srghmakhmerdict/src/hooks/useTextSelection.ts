import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Use a ref to track visibility without triggering effect re-runs
  const isVisibleRef = useRef(visible)

  useEffect(() => {
    isVisibleRef.current = visible
  }, [visible])

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setVisible(false)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleSelectionChange = () => {
      // 1. Immediately hide popup when user starts dragging/changing selection.
      // This prevents visual glitches and ensures we don't calculate on transient states.
      if (isVisibleRef.current) {
        setVisible(false)
      }

      clearTimeout(timeoutId)

      // Increased delay slightly (300 -> 400ms) to allow Android selection handles to settle
      timeoutId = setTimeout(() => {
        const selection = window.getSelection()

        // 2. CRITICAL FIX: Check if selection exists AND if nodes are still connected to DOM.
        // If React re-rendered the text while dragging, the selection nodes might be detached,
        // causing getBoundingClientRect to crash or return garbage.
        if (
          !selection ||
          selection.rangeCount === 0 ||
          !selection.anchorNode?.isConnected ||
          !selection.focusNode?.isConnected
        ) {
          setVisible(false)

          return
        }

        const range = getSafeRange(selection)

        if (!range) {
          setVisible(false)

          return
        }

        // 3. Check if the range container is still valid
        if (!range.commonAncestorContainer.isConnected) {
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

        try {
          // 4. Wrap getBoundingClientRect in try-catch as a final safety net for detached nodes
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
        } catch (e) {
          console.warn('Selection range invalidated during calculation', e)
          setVisible(false)
        }
      }, 400)
    }

    // --- INTERACTION HANDLERS ---

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement

      // IGNORE clicks inside our popup
      if (target.closest('[data-selection-popup="true"]')) return

      // On mobile, tapping outside usually clears selection, so we hide immediately
      setVisible(false)
    }

    const handlePointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement

      // IGNORE release events from our popup (e.g. finishing a drag)
      if (target.closest('[data-selection-popup="true"]')) return

      handleSelectionChange()
    }

    const handleInteract = () => {
      // Hide on scroll/resize to prevent popup floating in wrong place
      if (isVisibleRef.current) {
        setVisible(false)
      }
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
