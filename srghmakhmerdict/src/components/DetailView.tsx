import React from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Spinner } from '@heroui/spinner'

import { type DictionaryLanguage } from '../types'
import type { KhmerWordsMap } from '../db/dict'

import { DetailViewFound } from './DetailView/DetailViewFound'
import { DetailViewNotFound } from './DetailView/DetailViewNotFound'
import { useWordData } from '../hooks/useWordData'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  highlightMatch: NonEmptyStringTrimmed | undefined
  backButton_goBack: () => void | undefined
  backButton_desktopOnlyStyles_showButton: boolean
  km_map: KhmerWordsMap
  setKhmerAnalyzerModalText_setToOpen: (v: NonEmptyStringTrimmed) => void
}

const DetailViewImpl = ({
  word,
  mode,
  onNavigate,
  backButton_goBack,
  km_map,
  backButton_desktopOnlyStyles_showButton,
  setKhmerAnalyzerModalText_setToOpen,
}: DetailViewProps) => {
  const res = useWordData(word, mode)

  // 1. Loading state
  if (res.t === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner color="primary" size="lg" />
      </div>
    )
  }

  // 4. Not Found (Show Analyzer)
  if (res.t === 'not_found') {
    return (
      <DetailViewNotFound
        backButton_desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
        backButton_goBack={backButton_goBack}
        km_map={km_map}
        mode={mode}
        word={word}
        onNavigate={onNavigate}
      />
    )
  }

  // 5. Found (Show Details)
  return (
    <DetailViewFound
      backButton_desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
      backButton_goBack={backButton_goBack}
      data={res.data}
      isFav={res.isFav}
      km_map={km_map}
      mode={mode}
      setKhmerAnalyzerModalText_setToOpen={setKhmerAnalyzerModalText_setToOpen}
      toggleFav={res.toggleFav}
      word={word}
      onNavigate={onNavigate}
    />
  )
}

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
