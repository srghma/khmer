import React, { useRef, useState, useEffect, useCallback, useId, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Card } from '@heroui/react'
import { useMove } from '@react-aria/interactions'
import { RxDragHandleDots2 } from 'react-icons/rx'
import { getValidSelection, isClickInside } from './selection-utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface ReactSelectionPopupProps {
  children: ReactNode
  popupContent: (text: NonEmptyStringTrimmed) => ReactNode
}

interface Position {
  x: number
  y: number
}

const cardClassNames = {
  base: 'w-full md:w-[40vw] max-h-[40vh] md:max-h-[50vh]',
}

export const ReactSelectionPopup: React.FC<ReactSelectionPopupProps> = ({ children, popupContent }) => {
  const uniqueId = useId().replace(/:/g, '')
  const wrapperClass = `selection-wrapper-${uniqueId}`

  // State
  const [selectedText, setSelectedText] = useState<NonEmptyStringTrimmed | null>(null)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isBottomDocked, setIsBottomDocked] = useState(false)

  // Refs
  const popupRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 1. Mobile Detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 2. Handle Dragging (React Aria)
  const { moveProps } = useMove({
    onMoveStart: () => {
      // Transition from CSS docked position to absolute position for dragging
      if (isBottomDocked && popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect()

        setPosition({ x: rect.left, y: rect.top })
        setIsBottomDocked(false)
      }
    },
    onMove: e => {
      setPosition(prev => ({
        x: prev.x + e.deltaX,
        y: prev.y + e.deltaY,
      }))
    },
  })

  // 3. Handle Selection Change
  const handleSelectionChange = useCallback(() => {
    const selectionData = getValidSelection(wrapperClass)

    if (selectionData) {
      setSelectedText(selectionData.text)

      const domSelection = window.getSelection()

      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const isTopHalf = rect.top < windowHeight * 0.4

        if (window.innerWidth < 768) {
          // MOBILE Logic
          if (isTopHalf) {
            setIsBottomDocked(true)
            setPosition({ x: 0, y: 0 })
          } else {
            setIsBottomDocked(false)
            setPosition({ x: 0, y: 20 })
          }
        } else {
          // DESKTOP Logic
          setIsBottomDocked(false)
          setPosition({ x: 0, y: 0 })
        }
      }
    } else {
      const domSelection = window.getSelection()

      if (!domSelection || domSelection.isCollapsed) {
        setSelectedText(null)
      }
    }
  }, [wrapperClass])

  // 4. Handle Outside Interaction (Document level)
  const handleDocumentPointerDown = useCallback((e: PointerEvent) => {
    const target = e.target

    if (!isClickInside(target, wrapperRef.current) && !isClickInside(target, popupRef.current)) {
      setSelectedText(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('pointerdown', handleDocumentPointerDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
    }
  }, [handleSelectionChange, handleDocumentPointerDown])

  // 5. Memoized Props & Styles
  const popupStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      maxWidth: '100vw',
    }

    if (isMobile && isBottomDocked) {
      return { ...baseStyle, left: 0, bottom: 0, top: 'auto', width: '100vw' }
    }

    return { ...baseStyle, left: position.x, top: position.y, width: isMobile ? '100vw' : undefined }
  }, [isMobile, isBottomDocked, position.x, position.y])

  // --- Event Isolation Handlers ---
  // Stop propagation to prevent events from bubbling up to parent components (like DetailView)
  const handleStopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  // Drag handle specifically needs preventDefault to avoid text selection
  const handleDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const content = selectedText ? popupContent(selectedText) : null

  return (
    <>
      <div ref={wrapperRef} className={wrapperClass}>
        {children}
      </div>

      {selectedText && content && typeof document !== 'undefined'
        ? createPortal(
            <Card
              ref={popupRef}
              className="fixed z-[9999] shadow-xl border border-default-200 dark:border-default-100 bg-content1/90 backdrop-blur-md rounded-lg overflow-hidden flex flex-col"
              classNames={cardClassNames}
              style={popupStyle}
              onClick={handleStopPropagation}
              onMouseDown={handleMouseDown}
              onMouseUp={handleStopPropagation}
              onPointerDown={handleStopPropagation} // Isolate all interaction events
            >
              {/* Drag Handle */}
              <button
                {...moveProps}
                className="flex justify-center items-center py-2 cursor-grab active:cursor-grabbing bg-default-100/50 hover:bg-default-200/50 dark:bg-zinc-800/50 transition-colors border-b border-default-100 touch-none w-full"
                title="Drag to move"
                onMouseDown={handleDragHandleMouseDown}
              >
                <RxDragHandleDots2 className="text-default-400 rotate-90 text-xl" />
              </button>

              {/* Content Area */}
              <div className="p-2 overflow-y-auto custom-scrollbar relative">{content}</div>
            </Card>,
            document.body,
          )
        : null}
    </>
  )
}
