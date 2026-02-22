import React, { useMemo, useSyncExternalStore, useState, useCallback } from 'react'
import { Grade } from 'femto-fsrs'
import { mkFourButtons, type FourButtons } from './utils'
import { AnkiRevealButton, AnkiRatingButtons } from './AnkiButtons'
import { DetailFetcher } from './DetailFetcher'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export type GameState = {
  selectedId: NonEmptyStringTrimmed | undefined
  isRevealed: boolean
}

import { type GameModeAndDataItem } from './useAnkiGameManagerInitialData'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useSettings } from '../../providers/SettingsProvider'

interface AnkiPlayAreaProps {
  itemData: GameModeAndDataItem
  onRate: (rating: Grade) => void
}

export const AnkiPlayArea = React.memo(function AnkiPlayArea({ itemData, onRate }: AnkiPlayAreaProps) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot) as number

  const item = 'card' in itemData.v ? itemData.v.card : itemData.v

  const [userAnswer, setUserAnswer] = useState<string>('')
  const [isRevealed, setIsRevealed] = useState(false)

  const handleReveal = useCallback(() => {
    setIsRevealed(true)
  }, [])

  const mode = itemData.t
  const language = item.language

  const buttons: FourButtons = useMemo(() => mkFourButtons(item, now, i => i), [item, now])

  const { khmerWordsHidingMode: khmerWordsHidingMode_global, nonKhmerWordsHidingMode: nonKhmerWordsHidingMode_global } =
    useSettings()

  const isKhmerHidingForced = ['ru:GUESSING_KHMER', 'en:GUESSING_KHMER', 'km:GUESSING_KHMER'].some(x => x === mode)
  const isNonKhmerHidingForced = ['ru:GUESSING_NON_KHMER', 'en:GUESSING_NON_KHMER', 'km:GUESSING_NON_KHMER'].some(
    x => x === mode,
  )

  const khmerWordsHidingMode =
    isRevealed || !isKhmerHidingForced
      ? 'disabled'
      : khmerWordsHidingMode_global === 'disabled'
        ? 'on_click_reveal'
        : khmerWordsHidingMode_global

  const nonKhmerWordsHidingMode =
    isRevealed || !isNonKhmerHidingForced
      ? 'disabled'
      : nonKhmerWordsHidingMode_global === 'disabled'
        ? 'on_click_reveal'
        : nonKhmerWordsHidingMode_global

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      <div className="flex-1 min-h-0 relative scaling-details">
        <DetailFetcher
          additional_html_back={item.additional_html_back ?? undefined}
          additional_html_front={item.additional_html_front ?? undefined}
          ankiGameMode={mode}
          isRevealed={isRevealed}
          khmerWordsHidingMode={khmerWordsHidingMode}
          language={language}
          nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
          setUserAnswer={setUserAnswer}
          userAnswer={userAnswer}
          word={item.word}
          onReveal={handleReveal}
        />
      </div>

      <div className="flex-none bg-background/95 backdrop-blur-md border-t border-divider px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-center z-20 sticky bottom-0">
        {!isRevealed ? (
          <AnkiRevealButton onReveal={handleReveal} />
        ) : (
          <AnkiRatingButtons buttons={buttons} onRate={onRate} />
        )}
      </div>
    </div>
  )
})

AnkiPlayArea.displayName = 'AnkiPlayArea'
