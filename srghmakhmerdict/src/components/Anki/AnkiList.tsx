import React from 'react'
import type { FavoriteItem } from '../../db/favorite/item'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { AnkiDirection } from './types'
import { AnkiListItem } from './AnkiListItem'

export const AnkiList = React.memo(
  ({
    items,
    selectedWord,
    onSelect,
    mode,
  }: {
    items: ReadonlyArray<FavoriteItem>
    selectedWord: NonEmptyStringTrimmed | undefined
    onSelect: (word: NonEmptyStringTrimmed) => void
    mode: AnkiDirection
  }) => {
    return (
      <div className="flex-1 overflow-y-auto bg-content1">
        {items.map(item => (
          <AnkiListItem
            key={item.word}
            card={item}
            direction={mode}
            isSelected={selectedWord === item.word}
            onSelect={card => onSelect(card.word)}
          />
        ))}
      </div>
    )
  },
)

AnkiList.displayName = 'AnkiList'
