import React, { useMemo } from 'react'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { DictionaryLanguage } from '../../types'
import { AnkiListItem } from './AnkiListItem'
import { useAnkiGameInitialData } from './useAnkiGameManagerInitialData'
import type { FavoriteItem } from '../../db/favorite/item'
import type { KhmerWordsMap } from '../../db/dict'

const loading = (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

interface AnkiListContentProps {
  language: DictionaryLanguage
  direction: 'GUESSING_KHMER' | 'GUESSING_NON_KHMER'
  items: NonEmptyArray<FavoriteItem>
  selectedId: string | null
  onSelect: (id: string) => void
  km_map: KhmerWordsMap
}

export const AnkiListContent = React.memo(function AnkiListContent({
  language,
  direction,
  items,
  selectedId,
  onSelect,
  km_map,
}: AnkiListContentProps) {
  const data = useAnkiGameInitialData(language, direction, items)
  // We use a constant 'now' for the list to avoid second-by-second re-renders.
  // It enters when the component mounts.
  const now = useMemo(() => Date.now(), [])

  if (data === 'loading') {
    return loading
  }

  // Memoize the list items generation to avoid map recreation on every render if data hasn't changed
  const listItems = useMemo(() => {
    switch (data.t) {
      case 'GUESS_NON_KHMER_km':
      case 'GUESS_KHMER_en':
      case 'GUESS_KHMER_ru':
        return data.v.map(item => (
          <AnkiListItem
            key={item.word}
            card_due={item.due}
            isSelected={selectedId === item.word}
            km_map={km_map}
            now={now}
            t={data.t}
            v={item.word}
            onSelect={() => onSelect(item.word)}
          />
        ))
      case 'GUESS_KHMER_km':
        return data.v.map(({ card, description }) => (
          <AnkiListItem
            key={card.word}
            card_due={card.due}
            isSelected={selectedId === card.word}
            km_map={km_map}
            now={now}
            t={data.t}
            v={description}
            onSelect={() => onSelect(card.word)}
          />
        ))
      case 'GUESS_NON_KHMER_en':
        return data.v.map(({ card, description }) => (
          <AnkiListItem
            key={card.word}
            card_due={card.due}
            isSelected={selectedId === card.word}
            km_map={km_map}
            now={now}
            t={data.t}
            v={description}
            onSelect={() => onSelect(card.word)}
          />
        ))
      case 'GUESS_NON_KHMER_ru':
        return data.v.map(({ card, description }) => (
          <AnkiListItem
            key={card.word}
            card_due={card.due}
            isSelected={selectedId === card.word}
            km_map={km_map}
            now={now}
            t={data.t}
            v={description}
            onSelect={() => onSelect(card.word)}
          />
        ))
      default:
        return null
    }
  }, [data, selectedId, now, onSelect, km_map])

  return <div className="flex-1 overflow-y-auto w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">{listItems}</div>
})

AnkiListContent.displayName = 'AnkiListContent'
