import React, { useCallback } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { DetailView } from './DetailView'
import { type DictionaryLanguage } from '../types'
import { useNavigation } from '../providers/NavigationProvider'

interface RightPanelProps {
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | null
  onBack: () => void // Legacy prop for 'closing' the panel entirely
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void // Legacy
  detailsFontSize: number
  highlightInDetails: boolean
  searchQuery: string
  km_setOfPureKhmerWords: Set<TypedKhmerWord> | undefined
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedWord,
  detailsFontSize,
  highlightInDetails,
  searchQuery,
  km_setOfPureKhmerWords,
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

  if (!selectedWord) {
    return (
      <div className="hidden md:flex flex-1 bg-background items-center justify-center text-default-400 p-8 text-center">
        <div>
          <p className="mb-2 text-lg font-semibold">Welcome to Khmer Dictionary</p>
          <p className="text-sm">Select a word from the list to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none">
      <DetailView
        word={selectedWord.word}
        mode={selectedWord.mode}
        fontSize={detailsFontSize}
        highlightMatch={highlightInDetails ? searchQuery : undefined}
        km_setOfPureKhmerWords={km_setOfPureKhmerWords}
        
        // Pass the smart back handler
        onBack={handleBack} 
        
        // Pass the PUSH navigation handler
        onNavigate={navigateTo} 
        
        // Pass history state to control UI of the back button
        canGoBack={canGoBack} 
      />
    </div>
  )
}
