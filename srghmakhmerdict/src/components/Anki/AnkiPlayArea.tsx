import React, { useMemo, useSyncExternalStore, useState, useEffect } from 'react'
import { Grade } from 'femto-fsrs'
import { mkFourButtons, type FourButtons } from './utils'
import { AnkiRevealButton, AnkiRatingButtons } from './AnkiButtons'
import { DetailFetcher } from './DetailFetcher'
import type { KhmerWordsMap } from '../../db/dict'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export type GameState = {
  selectedId: NonEmptyStringTrimmed | undefined
  isRevealed: boolean
}

import { type GameModeAndDataItem } from './useAnkiGameManagerInitialData'
import { useAnkiPulseStore } from './AnkiPulseContext'

interface AnkiPlayAreaProps {
  itemData: GameModeAndDataItem
  isRevealed: boolean
  onRate: (rating: Grade) => void
  onReveal: () => void
  onBack: () => void
  km_map: KhmerWordsMap
}

export const AnkiPlayArea = React.memo(
  ({ itemData, isRevealed, onRate, onReveal, onBack, km_map }: AnkiPlayAreaProps) => {
    const pulseStore = useAnkiPulseStore()
    const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot) as number

    const item = 'card' in itemData.v ? itemData.v.card : itemData.v

    const [userAnswer, setUserAnswer] = useState<string>('')

    useEffect(() => {
      setUserAnswer('')
    }, [item.word])

    const mode = itemData.t
    const language = item.language

    const buttons: FourButtons = useMemo(() => mkFourButtons(item, now, i => i), [item, now])

    const isKhmerWordsHidingEnabled = ['ru:GUESS_KHMER', 'en:GUESS_KHMER', 'km:GUESS_KHMER'].includes(mode)
    const isNonKhmerWordsHidingEnabled = ['ru:GUESS_NON_KHMER', 'en:GUESS_NON_KHMER', 'km:GUESS_NON_KHMER'].includes(
      mode,
    )

    return (
      <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
        <div className="flex-1 min-h-0 relative">
          <DetailFetcher
            ankiGameMode={mode}
            isKhmerWordsHidingEnabled={isRevealed ? false : isKhmerWordsHidingEnabled}
            isNonKhmerWordsHidingEnabled={isRevealed ? false : isNonKhmerWordsHidingEnabled}
            isRevealed={isRevealed}
            km_map={km_map}
            language={language}
            setUserAnswer={setUserAnswer}
            userAnswer={userAnswer}
            word={item.word}
            onBack={onBack}
            onReveal={onReveal}
          />
        </div>

        <div className="flex-none bg-background/95 backdrop-blur-md border-t border-divider px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-center z-20 sticky bottom-0">
          {!isRevealed ? (
            <AnkiRevealButton onReveal={onReveal} />
          ) : (
            <AnkiRatingButtons buttons={buttons} onRate={onRate} />
          )}
        </div>
      </div>
    )
  },
)

AnkiPlayArea.displayName = 'AnkiPlayArea'
