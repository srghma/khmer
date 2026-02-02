import React, { useRef, useState, useEffect } from 'react'
import { Card, Label } from '@heroui/react'
import { ListBox } from '@heroui/react'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { createPortal } from 'react-dom'
import { SiGoogletranslate } from 'react-icons/si'
import { RxDragHandleDots2 } from 'react-icons/rx'

import { NativeSpeakerIcon } from '../NativeSpeakerIcon'
import { KhmerAnalyzer } from '../KhmerAnalyzer'
import type { Position } from '../../utils/selectionUtils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useMemo, useCallback } from 'react'
import type { DictionaryLanguage } from '../../types'
import { FirstNonEmptyShortDetailView } from './FirstNonEmptyShortDetailView'
import type { KhmerWordsMap } from '../../db/dict'
import { generateTextSegments } from '../../utils/text-processing/text'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

interface SelectionPopupProps {
  position: Position
  selectedText: NonEmptyStringTrimmed | undefined
  useFullWidth: boolean
  onAction: (action: 'search' | 'native' | 'google' | 'khmer_analyzer') => void
  currentMode: DictionaryLanguage
  km_map: KhmerWordsMap | undefined
  visible: boolean
}

const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const NativeSpeakerIcon_ = <NativeSpeakerIcon className="text-xl text-default-500" />
const SiGoogletranslate_ = <SiGoogletranslate className="text-xl text-default-500" />
const KhmerKaIcon = <span className="text-xl text-default-500 font-khmer">ក</span>

const dragStartRefInitial = { x: 0, y: 0 }

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  useFullWidth,
  onAction,
  currentMode,
  km_map,
  visible,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  const [offset, setOffset] = useState(dragStartRefInitial)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(dragStartRefInitial)

  // Reset offset when the underlying word changes.
  // Previously handled by key={selectedText} in parent, but that caused unmount/crash.
  useEffect(() => {
    setOffset(dragStartRefInitial)
  }, [selectedText])

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
      touchAction: 'none' as const,
      // CSS Visibility Toggle instead of Unmounting
      visibility: visible ? ('visible' as const) : ('hidden' as const),
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? ('auto' as const) : ('none' as const),
    }),
    [renderX, renderY, useFullWidth, isDragging, visible],
  )

  const truncatedText = useMemo(() => {
    if (!selectedText) return

    return selectedText.length > 15 ? selectedText.slice(0, 12) + '...' : selectedText
  }, [selectedText])

  const searchFallback = useMemo(
    () => (
      <span className="font-medium group-hover:text-primary transition-colors">Search &quot;{truncatedText}&quot;</span>
    ),
    [truncatedText],
  )

  const segments = useMemo(() => {
    if (!selectedText) return undefined
    if (selectedText.length < 20) return undefined
    if (!km_map) return undefined
    const k = strToContainsKhmerOrUndefined(selectedText)

    if (!k) return undefined

    return generateTextSegments(k, 'segmenter', km_map)
  }, [selectedText, km_map])

  return createPortal(
    <div
      ref={menuRef}
      // "data-selection-popup" is checked by the useTextSelection hook
      // CRITICAL: select-none ensures Android selection handles don't accidentally
      // grab this popup's text, which triggers the 'tag not found' crash.
      className="fixed z-[9999] select-none"
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

        <Card.Content className="p-1 pt-0">
          <ListBox aria-label="Context Menu Actions" onAction={handleAction}>
            <ListBox.Item key="search" className="group" textValue="Search">
              {HiMagnifyingGlass_}
              {selectedText ? (
                <FirstNonEmptyShortDetailView
                  fallback={searchFallback}
                  km_map={km_map}
                  mode={currentMode}
                  word={selectedText}
                />
              ) : null}
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item key="native" textValue="Native">
              {NativeSpeakerIcon_}
              <Label>Speak Native</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item key="google" textValue="Google">
              {SiGoogletranslate_}
              <Label>Speak Google</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item key="khmer_analyzer" textValue="Khmer Analyzer">
              {KhmerKaIcon}
              <Label>Open Khmer Analyzer</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>

          {segments && (
            <div className="max-h-[300px] overflow-y-auto p-2 bg-background border-t border-default-100">
              <KhmerAnalyzer segments={segments} />
            </div>
          )}
        </Card.Content>
      </Card>
    </div>,
    document.body,
  )
}
