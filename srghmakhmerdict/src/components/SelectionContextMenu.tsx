import React, { useCallback, useState, Suspense } from 'react'

import { executeNativeTts, executeGoogleTts, mapModeToNativeLang } from '../utils/tts'
import { type DictionaryLanguage } from '../types'
import { useTextSelection } from '../hooks/useTextSelection'
import { detectModeFromText } from '../utils/rendererUtils'
import { usePreloadOnIdle } from '../utils/lazyWithPreload'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import lazyWithPreload from 'react-lazy-with-preload'
import type { KhmerWordsMap } from '../db/dict'
import type { ColorizationMode } from '../utils/text-processing'

// --- 1. Define Lazy Components with Named Export Adapters ---

const SelectionPopup = lazyWithPreload(() =>
  import('./SelectionContextMenu/SelectionPopup').then(module => ({
    default: module.SelectionPopup,
  })),
)

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

  usePreloadOnIdle([SelectionPopup, KhmerAnalyzerModal])

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

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setModalText(undefined)
  }, [])

  return (
    <>
      {/* Selection Popup */}
      {visible && selectedText && (
        <Suspense fallback={null}>
          <SelectionPopup
            key={selectedText}
            position={position}
            selectedText={selectedText}
            useFullWidth={useFullWidth}
            onAction={handleAction}
          />
        </Suspense>
      )}

      {/* Khmer Analyzer Modal */}
      {isModalOpen && modalText && (
        <Suspense fallback={null}>
          <KhmerAnalyzerModal
            colorMode={colorMode}
            currentMode={currentMode}
            isOpen={isModalOpen}
            km_map={km_map}
            text={modalText}
            onClose={handleModalClose}
          />
        </Suspense>
      )}
    </>
  )
}
