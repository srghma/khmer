import React, { useCallback, Suspense, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Spinner } from '@heroui/spinner'
import { type DictionaryLanguage } from '../types'
import { useNavigation } from '../providers/NavigationProvider'
import type { KhmerWordsMap } from '../db/dict'
import lazyWithPreload from 'react-lazy-with-preload'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'

// --- LAZY IMPORT ---
const DetailView = lazyWithPreload(() => import('./DetailView').then(m => ({ default: m.DetailView })))

interface RightPanelProps {
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | null
  onBack: () => void // Legacy prop for 'closing' the panel entirely
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void // Legacy
  detailsFontSize: number
  highlightInDetails: boolean
  searchQuery: NonEmptyStringTrimmed | undefined
  km_map: KhmerWordsMap | undefined
  setKhmerAnalyzerModalText_setToOpen: (v: NonEmptyStringTrimmed | undefined) => void
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
  maybeColorMode,
  setMaybeColorMode,
  setKhmerAnalyzerModalText_setToOpen,
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

  const highlightMatch = useMemo(
    () => (highlightInDetails && searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery, highlightInDetails],
  )

  if (!selectedWord) return NoSelectedWord

  return (
    <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none">
      <Suspense fallback={SuspenseFallback}>
        {/* Detail View Wrapper with Selection Class */}
        <DetailView
          canGoBack={canGoBack}
          fontSize={detailsFontSize}
          highlightMatch={highlightMatch}
          km_map={km_map}
          maybeColorMode={maybeColorMode}
          mode={selectedWord.mode}
          setKhmerAnalyzerModalText_setToOpen={setKhmerAnalyzerModalText_setToOpen}
          setMaybeColorMode={setMaybeColorMode}
          word={selectedWord.word}
          onBack={handleBack}
          onNavigate={navigateTo}
        />
      </Suspense>
    </div>
  )
}
