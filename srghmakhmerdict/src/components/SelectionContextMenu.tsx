import React, { useCallback, useState, Suspense } from 'react'

import { executeNativeTts, executeGoogleTts, mapModeToNativeLang } from '../utils/tts'
import { type DictionaryLanguage } from '../types'
import { useTextSelection } from '../hooks/useTextSelection'
import { detectModeFromText } from '../utils/rendererUtils'
import { usePreloadOnIdle } from '../utils/lazyWithPreload'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import lazyWithPreload from 'react-lazy-with-preload'
import type { KhmerWordsMap } from '../db/dict'
import type { ColorizationMode } from '../utils/text-processing/utils'
import { SelectionPopup } from './SelectionContextMenu/SelectionPopup'

// --- 1. Define Lazy Components with Named Export Adapters ---

const KhmerAnalyzerModal = lazyWithPreload(() =>
  import('./SelectionContextMenu/KhmerAnalyzerModal').then(module => ({
    default: module.KhmerAnalyzerModal,
  })),
)

// --- 2. Main Component ---

interface SelectionContextMenuProps {
  currentMode: DictionaryLanguage
  onSearch: (text: NonEmptyStringTrimmed) => void
  containerRef?: React.RefObject<HTMLElement | null>
  colorMode: ColorizationMode
  km_map: KhmerWordsMap | undefined
}

export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  currentMode,
  onSearch,
  containerRef,
  colorMode,
  km_map,
}) => {
  const { visible, position, selectedText, clearSelection, setVisible, useFullWidth } = useTextSelection(containerRef)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalText, setModalText] = useState<NonEmptyStringTrimmed | undefined>()

  usePreloadOnIdle([KhmerAnalyzerModal])

  const handleAction = useCallback(
    async (action: 'search' | 'native' | 'google' | 'khmer_analyzer') => {
      if (!selectedText) return

      const detectedMode = detectModeFromText(selectedText, currentMode)

      switch (action) {
        case 'search':
          onSearch(selectedText)
          setVisible(false)
          clearSelection()
          break

        case 'native':
          executeNativeTts(selectedText, mapModeToNativeLang(detectedMode))
          setVisible(false)
          clearSelection()
          break

        case 'google':
          await executeGoogleTts(selectedText, detectedMode)
          setVisible(false)
          clearSelection()
          break

        case 'khmer_analyzer':
          setModalText(selectedText)
          setIsModalOpen(true)
          setVisible(false)
          clearSelection()
          break
      }
    },
    [selectedText, onSearch, currentMode, setVisible, clearSelection],
  )

  const handleModalClose = useCallback((isOpen: boolean) => {
    setIsModalOpen(isOpen)
    if (!isOpen) setModalText(undefined)
  }, [])

  // Calculate actual visibility boolean to pass down
  const isPopupVisible = visible && !!selectedText

  return (
    <>
      {/*
        Selection Popup
        CRITICAL: Always render this component to prevent mounting/unmounting cycles
        during text selection dragging, which causes Android WebView crashes.
        We control visibility via props/CSS instead.
      */}
      <SelectionPopup
        currentMode={currentMode}
        km_map={km_map}
        position={position}
        selectedText={selectedText}
        useFullWidth={useFullWidth}
        visible={isPopupVisible}
        onAction={handleAction}
      />

      {/* Khmer Analyzer Modal */}
      {isModalOpen && modalText && (
        <Suspense fallback={null}>
          <KhmerAnalyzerModal
            colorMode={colorMode}
            currentMode={currentMode}
            isOpen={isModalOpen}
            km_map={km_map}
            text={modalText}
            onOpenChange={handleModalClose}
          />
        </Suspense>
      )}
    </>
  )
}
