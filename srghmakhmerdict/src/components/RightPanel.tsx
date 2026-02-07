import React, { useCallback, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { useNavigation } from '../providers/NavigationProvider'
import type { KhmerWordsMap } from '../db/dict'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import { useSettings } from '../providers/SettingsProvider'
import { DetailView } from './DetailView'

interface RightPanelProps {
  maybeColorMode: MaybeColorizationMode
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | undefined
  onBack: () => void // Legacy prop for 'closing' the panel entirely
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void // Legacy
  searchQuery: NonEmptyStringTrimmed | undefined
  km_map: KhmerWordsMap
  setKhmerAnalyzerModalText_setToOpen: (v: NonEmptyStringTrimmed) => void
}

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
  searchQuery,
  km_map,
  setKhmerAnalyzerModalText_setToOpen,
}) => {
  // Use the global navigation hooks
  const { navigateTo, goBack, clearSelection, canGoBack } = useNavigation()

  // Logic:
  // - If we have history, Back button -> goBack()
  // - If no history (e.g. came from sidebar), Back button -> clearSelection() (Close Panel on Mobile)
  const backButton_goBack = useCallback(() => {
    if (canGoBack) {
      goBack()
    } else {
      clearSelection()
    }
  }, [canGoBack, goBack, clearSelection])

  const { highlightInDetails } = useSettings()

  const highlightMatch = useMemo(
    () => (highlightInDetails && searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery, highlightInDetails],
  )

  if (!selectedWord) return NoSelectedWord

  return (
    <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none">
      {/* Detail View Wrapper with Selection Class */}
      <DetailView
        backButton_desktopOnlyStyles_showButton={canGoBack}
        backButton_goBack={backButton_goBack}
        highlightMatch={highlightMatch}
        km_map={km_map}
        mode={selectedWord.mode}
        setKhmerAnalyzerModalText_setToOpen={setKhmerAnalyzerModalText_setToOpen}
        word={selectedWord.word}
        onNavigate={navigateTo}
      />
    </div>
  )
}
