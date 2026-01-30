import React, { useRef, useState } from 'react'
import { Card, CardBody } from '@heroui/card'
import { Listbox, ListboxItem } from '@heroui/listbox'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { createPortal } from 'react-dom'
import { SiGoogletranslate } from 'react-icons/si'
import { RxDragHandleDots2 } from 'react-icons/rx'

import { NativeSpeakerIcon } from '../NativeSpeakerIcon'
import { KhmerAnalyzer } from '../KhmerAnalyzer'
import type { Position } from '../../utils/selectionUtils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useMemo, useCallback } from 'react'

interface SelectionPopupProps {
  position: Position
  selectedText: NonEmptyStringTrimmed
  useFullWidth: boolean
  onAction: (action: 'search' | 'native' | 'google' | 'khmer_analyzer') => void
}

const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const NativeSpeakerIcon_ = <NativeSpeakerIcon className="text-xl text-default-500" />
const SiGoogletranslate_ = <SiGoogletranslate className="text-xl text-default-500" />
const KhmerKaIcon = <span className="text-xl text-default-500 font-khmer">ក</span>

const dragStartRefInitial = { x: 0, y: 0 }

export const SelectionPopup: React.FC<SelectionPopupProps> = ({ position, selectedText, useFullWidth, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // Local state for manual user offset.
  // We rely on the parent's `key={selectedText}` to reset this to {0,0} when the word changes.
  const [offset, setOffset] = useState(dragStartRefInitial)
  const [isDragging, setIsDragging] = useState(false)

  // Tracks where the mouse was relative to the offset when dragging started
  const dragStartRef = useRef(dragStartRefInitial)

  const handleAction = useCallback(
    (key: React.Key) => {
      onAction(key as 'search' | 'native' | 'google' | 'khmer_analyzer')
    },
    [onAction],
  )

  // --- Pointer Drag Logic (Works for Mouse, Touch, Pen) ---

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement

      target.setPointerCapture(e.pointerId)
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      }
    },
    [offset.x, offset.y],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      e.preventDefault()
      e.stopPropagation()

      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return

      e.preventDefault()
      e.stopPropagation()

      setIsDragging(false)
      const target = e.currentTarget as HTMLElement

      target.releasePointerCapture(e.pointerId)
    },
    [isDragging],
  )

  // Final position combines the Anchor (props) + User Offset (state)
  const renderX = useMemo(() => position.x + offset.x, [position.x, offset.x])
  const renderY = useMemo(() => position.y + offset.y, [position.y, offset.y])

  const popupStyle = useMemo(
    () => ({
      top: renderY,
      left: renderX,
      width: useFullWidth ? `calc(100vw - 20px)` : 'auto',
      minWidth: useFullWidth ? undefined : '200px',
      transition: isDragging ? 'none' : 'top 0.2s ease-out, left 0.2s ease-out',
      touchAction: 'none',
    }),
    [renderX, renderY, useFullWidth, isDragging],
  )

  const truncatedText = useMemo(
    () => (selectedText.length > 15 ? selectedText.slice(0, 12) + '...' : selectedText),
    [selectedText],
  )

  return createPortal(
    <div
      ref={menuRef}
      // "data-selection-popup" is checked by the useTextSelection hook
      // to ignore clicks originating from inside this popup
      className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
      data-selection-popup="true"
      style={popupStyle}
    >
      <Card className="shadow-lg border border-default-200 dark:border-default-100 bg-content1/90 backdrop-blur-md">
        {/* Drag Handle */}
        <div
          className="flex justify-center items-center py-1 cursor-grab active:cursor-grabbing bg-default-100/50 hover:bg-default-200/50 transition-colors border-b border-default-100"
          title="Drag to move"
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <RxDragHandleDots2 className="text-default-400 rotate-90" />
        </div>

        <CardBody className="p-1 pt-0">
          <Listbox aria-label="Context Menu Actions" variant="light" onAction={handleAction}>
            <ListboxItem key="search" className="group" startContent={HiMagnifyingGlass_} textValue="Search">
              <span className="font-medium group-hover:text-primary transition-colors">
                Search &quot;{truncatedText}&quot;
              </span>
            </ListboxItem>
            <ListboxItem key="native" startContent={NativeSpeakerIcon_} textValue="Native">
              Speak Native
            </ListboxItem>
            <ListboxItem key="google" startContent={SiGoogletranslate_} textValue="Google">
              Speak Google
            </ListboxItem>
            <ListboxItem key="khmer_analyzer" startContent={KhmerKaIcon} textValue="Khmer Analyzer">
              Open Khmer Analyzer
            </ListboxItem>
          </Listbox>

          {selectedText.length < 20 && (
            <div className="max-h-[300px] overflow-y-auto p-2 bg-background border-t border-default-100">
              <KhmerAnalyzer text={selectedText} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>,
    document.body,
  )
}
