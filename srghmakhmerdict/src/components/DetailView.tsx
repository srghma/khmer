import React from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Spinner } from '@heroui/spinner'

import { type DictionaryLanguage } from '../types'

import { DetailViewFound } from './DetailView/DetailViewFound'
import { DetailViewNotFound } from './DetailView/DetailViewNotFound'
import { useWordData } from '../hooks/useWordData'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  highlightMatch: NonEmptyStringTrimmed | undefined
  backButton_goBack: (() => void) | undefined
  onNavigate?: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  isModal?: boolean
}

const DetailViewImpl = ({ word, mode, backButton_goBack, onNavigate, isModal }: DetailViewProps) => {
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
        backButton_goBack={backButton_goBack}
        isModal={isModal}
        mode={mode}
        word={word}
        onNavigate={onNavigate}
      />
    )
  }

  // 5. Found (Show Details)
  return (
    <DetailViewFound
      backButton_goBack={backButton_goBack}
      data={res.detail}
      isFav={res.isFav}
      isModal={isModal}
      mode={mode}
      toggleFav={res.toggleFav}
      word={word}
      onNavigate={onNavigate}
    />
  )
}

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
