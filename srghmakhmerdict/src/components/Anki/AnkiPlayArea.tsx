import React, { useMemo, useSyncExternalStore } from 'react'
import { Button } from '@heroui/button'
import { GoArrowLeft } from 'react-icons/go'
import { Grade } from 'femto-fsrs'
import { mkFourButtons, type FourButtons } from './utils'
import { AnkiRevealButton, AnkiRatingButtons } from './AnkiButtons'
import { DetailFetcher } from './DetailFetcher'
import type { KhmerWordsMap } from '../../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

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

export const AnkiPlayArea = React.memo(function AnkiPlayArea({
  itemData,
  isRevealed,
  onRate,
  onReveal,
  onBack,
  km_map,
}: AnkiPlayAreaProps) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot) as number

  const item = 'card' in itemData.v ? itemData.v.card : itemData.v

  const mode = itemData.t
  const language = item.language

  const buttons: FourButtons = useMemo(() => mkFourButtons(item, now, i => i), [item, now])

  const isKhmerWordsHidingEnabled = ['GUESS_KHMER_ru', 'GUESS_KHMER_en', 'GUESS_KHMER_km'].includes(mode)
  const isNonKhmerWordsHidingEnabled = ['GUESS_NON_KHMER_ru', 'GUESS_NON_KHMER_en', 'GUESS_NON_KHMER_km'].includes(mode)

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex md:hidden items-center px-2 py-2 border-b border-divider bg-background/80 backdrop-blur-md">
        <Button isIconOnly size="sm" variant="light" onPress={onBack}>
          <GoArrowLeft className="text-xl" />
        </Button>
        <span className="font-bold ml-2 line-clamp-1">{item.word}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest">
          {mode.includes('GUESS_KHMER') ? 'Translate to Khmer' : 'Translate / Define'}
        </span>

        {mode}

        <DetailFetcher
          isKhmerWordsHidingEnabled={isRevealed ? false : isKhmerWordsHidingEnabled}
          isNonKhmerWordsHidingEnabled={isRevealed ? false : isNonKhmerWordsHidingEnabled}
          km_map={km_map}
          language={language}
          word={item.word}
        />
      </div>

      <div className="shrink-0 bg-content1/90 backdrop-blur-lg border-t border-divider pb-[env(safe-area-inset-bottom)] p-4 flex justify-center">
        {!isRevealed ? (
          <AnkiRevealButton onReveal={onReveal} />
        ) : (
          <AnkiRatingButtons buttons={buttons} onRate={onRate} />
        )}
      </div>
    </div>
  )
})

AnkiPlayArea.displayName = 'AnkiPlayArea'
