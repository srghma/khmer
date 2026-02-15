import React, { type Dispatch, type SetStateAction } from 'react'
import type { DictionaryLanguage } from '../../types'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { useWordData } from '../../hooks/useWordData'
import { AnkiCardDetailView } from './AnkiCardDetailView'
import { type AnkiGameMode } from './types'

import { useI18nContext } from '../../i18n/i18n-react-custom'

const DetailFetcher_loading = (
  <div className="flex justify-center p-4">
    <Spinner size="sm" />
  </div>
)

export const DetailFetcher = React.memo(
  ({
    language,
    word,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isRevealed,
    ankiGameMode,
    userAnswer,
    setUserAnswer,
    onReveal,
  }: {
    language: DictionaryLanguage
    word: NonEmptyStringTrimmed
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isRevealed: boolean
    ankiGameMode: AnkiGameMode
    userAnswer: string
    setUserAnswer: Dispatch<SetStateAction<string>>
    onReveal: () => void
  }) => {
    const { LL } = useI18nContext()
    const result = useWordData(word, language)

    if (result.t === 'loading') return DetailFetcher_loading
    if (result.t === 'not_found') {
      return <div className="text-danger text-center p-4">{LL.ANKI.FETCH_FAILED()}</div>
    }

    const d: WordDetailEnOrRuOrKm = result.detail

    return (
      <AnkiCardDetailView
        ankiGameMode={ankiGameMode}
        data={d}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
        isRevealed={isRevealed}
        mode={language}
        setUserAnswer={setUserAnswer}
        userAnswer={userAnswer}
        word={word}
        onReveal={onReveal}
      />
    )
  },
)

DetailFetcher.displayName = 'DetailFetcher'
