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
  onExit: () => void
  km_map: KhmerWordsMap
}

export const AnkiPlayArea = React.memo(function AnkiPlayArea({
  itemData,
  isRevealed,
  onRate,
  onReveal,
  onBack,
  onExit,
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
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      {!isRevealed && (
        <div className="flex shrink-0 md:hidden items-center px-4 py-2 border-b border-divider bg-background/95 backdrop-blur-md pt-[calc(0.5rem+env(safe-area-inset-top))] min-h-[calc(3.5rem+env(safe-area-inset-top))]">
          <Button isIconOnly size="sm" variant="light" onPress={onBack}>
            <GoArrowLeft className="text-xl" />
          </Button>
          <span className="font-bold ml-2 line-clamp-1 text-lg">{item.word}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col relative">
        {!isRevealed ? (
          <div className="flex-1 overflow-y-auto p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col items-center">
            <div className="w-full flex flex-col items-center gap-2 mb-4">
              <span className="text-small uppercase text-default-400 font-bold tracking-widest text-center">
                {mode.includes('GUESS_KHMER') ? 'Translate to Khmer' : 'Translate / Define'}
              </span>
            </div>
            <DetailFetcher
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              isRevealed={false}
              km_map={km_map}
              language={language}
              word={item.word}
              onBack={onBack}
              onExit={onExit}
            />
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden">
            <DetailFetcher
              isKhmerWordsHidingEnabled={false}
              isNonKhmerWordsHidingEnabled={false}
              isRevealed={true}
              km_map={km_map}
              language={language}
              word={item.word}
              onBack={onBack}
              onExit={onExit}
            />
          </div>
        )}
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
})

AnkiPlayArea.displayName = 'AnkiPlayArea'
