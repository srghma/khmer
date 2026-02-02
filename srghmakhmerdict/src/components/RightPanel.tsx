import React, { useCallback, Suspense, useRef, useState, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Spinner } from '@heroui/spinner'
import { type DictionaryLanguage } from '../types'
import { useNavigation } from '../providers/NavigationProvider'
import type { KhmerWordsMap } from '../db/dict'
import lazyWithPreload from 'react-lazy-with-preload'
import { SelectionContextMenu } from './SelectionContextMenu'
import { detectModeFromText } from '../utils/rendererUtils'
import type { ColorizationMode } from '../utils/text-processing/utils'

// --- LAZY IMPORT ---
const DetailView = lazyWithPreload(() => import('./DetailView').then(m => ({ default: m.DetailView })))

interface RightPanelProps {
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | null
  onBack: () => void // Legacy prop for 'closing' the panel entirely
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void // Legacy
  detailsFontSize: number
  highlightInDetails: boolean
  searchQuery: string
  km_map: KhmerWordsMap | undefined
}

const SuspenseFallback = (
  <div className="flex-1 flex items-center justify-center h-full">
    <Spinner color="primary" size="lg" />
  </div>
)

const NoSelectedWord = (
  <div className="hidden md:flex flex-1 bg-background items-center justify-center text-default-400 p-8 text-center">
    <div>
      <p className="mb-2 text-lg font-semibold">Welcome to Khmer Dictionary</p>
      <p className="text-sm">Select a word from the list to view details</p>
    </div>
  </div>
)

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedWord,
  detailsFontSize,
  highlightInDetails,
  searchQuery,
  km_map,
}) => {
  // Use the global navigation hooks
  const { navigateTo, goBack, clearSelection, canGoBack } = useNavigation()

  // Logic:
  // - If we have history, Back button -> goBack()
  // - If no history (e.g. came from sidebar), Back button -> clearSelection() (Close Panel on Mobile)
  const handleBack = useCallback(() => {
    if (canGoBack) {
      goBack()
    } else {
      clearSelection()
    }
  }, [canGoBack, goBack, clearSelection])

  const handleSelectionSearch = useCallback(
    (text: string) => {
      if (!selectedWord) return
      const trimmed = String_toNonEmptyString_orUndefined_afterTrim(text)

      if (!trimmed) return
      const targetMode = detectModeFromText(trimmed, selectedWord.mode)

      navigateTo(trimmed, targetMode)
    },
    [navigateTo, selectedWord],
  )

  const [colorMode, setColorMode] = useState<ColorizationMode>('segmenter')
  const highlightMatch = useMemo(
    () => (highlightInDetails ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery, highlightInDetails],
  )

  const contentRef = useRef<HTMLDivElement>(null)

  if (!selectedWord) return NoSelectedWord

  return (
    <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none">
      <Suspense fallback={SuspenseFallback}>
        <SelectionContextMenu
          colorMode={colorMode}
          containerRef={contentRef}
          currentMode={selectedWord.mode}
          km_map={km_map}
          onSearch={handleSelectionSearch}
        />

        <DetailView
          ref={contentRef}
          canGoBack={canGoBack}
          colorMode={colorMode}
          fontSize={detailsFontSize}
          highlightMatch={highlightMatch}
          km_map={km_map}
          mode={selectedWord.mode}
          setColorMode={setColorMode}
          word={selectedWord.word}
          onBack={handleBack}
          onNavigate={navigateTo}
        />
      </Suspense>
    </div>
  )
}
