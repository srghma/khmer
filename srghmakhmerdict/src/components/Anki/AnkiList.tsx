import clsx from 'clsx'
import { format } from 'date-fns'
import React, { useMemo } from 'react'
import { Chip } from '@heroui/chip'

import type { FavoriteItem } from '../../db/favorite/favorite-item'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

type CardDetail = {
  item: FavoriteItem
  // detailShort: string | undefined
  isDue: boolean
  inferredState: 'New' | 'Review'
}

export function prepareList(items: FavoriteItem[]): CardDetail[] {
  const now = Date.now()

  return items.map(item => ({
    item,
    // detailShort: undefined, // Add logic to look up definitions if needed
    isDue: item.due <= now,
    inferredState: item.last_review === null ? 'New' : 'Review',
  }))
}

export const AnkiList = React.memo(
  ({
    items, // Pass the array of FavoriteItem
    selectedWord,
    onSelect,
  }: {
    items: FavoriteItem[]
    selectedWord: NonEmptyStringTrimmed | undefined
    onSelect: (word: NonEmptyStringTrimmed) => void
  }) => {
    const sortedList = useMemo(() => prepareList(items), [items])

    return (
      <div className="w-1/3 min-w-[250px] max-w-[350px] border-r border-divider flex flex-col bg-content2/50">
        <div className="p-4 font-bold text-lg border-b border-divider flex justify-between items-center">
          <span>Deck ({sortedList.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedList.map(({ item, isDue, inferredState }) => (
            <button
              key={item.word}
              className={clsx(
                'p-3 rounded-lg cursor-pointer transition-all border text-left flex flex-col gap-1',
                selectedWord === item.word
                  ? 'bg-primary/10 border-primary shadow-sm'
                  : 'bg-content1 border-transparent hover:border-default-200',
              )}
              onClick={() => onSelect(item.word)}
            >
              <div className="text-small font-medium text-foreground line-clamp-2 leading-tight">
                {item.word}
                {/* {card.detailShort || '(No Definition)'} */}
              </div>
              <div className="flex justify-between items-center mt-1">
                <Chip color={inferredState === 'New' ? 'primary' : 'default'} size="sm" variant="flat">
                  {inferredState}
                </Chip>
                <span className={clsx('text-[10px]', isDue ? 'text-danger font-bold' : 'text-default-400')}>
                  {isDue ? 'Due Now' : format(item.due, 'MMM d, HH:mm')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  },
)

AnkiList.displayName = 'AnkiList'
