import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedWithoutKhmerAndHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer-and-html'
import clsx from 'clsx'
import { format } from 'date-fns'
import React, { useMemo } from 'react'
import type { WordDetailKm } from '../../db/dict'
import { getBestDefinitionHtml } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import { State, type Card as FSRSCard } from '@squeakyrobot/fsrs'
import { Chip } from '@heroui/chip'

export const AnkiList = React.memo(
  ({
    items,
    cards,
    definitions,
    // km_map,
    selectedWord,
    onSelect,
  }: {
    items: TypedContainsKhmer[]
    cards: Record<TypedContainsKhmer, FSRSCard>
    definitions: Record<TypedContainsKhmer, WordDetailKm>
    // km_map: KhmerWordsMap
    selectedWord: TypedContainsKhmer | undefined
    onSelect: (word: TypedContainsKhmer) => void
  }) => {
    const sortedList = useMemo(() => {
      return items
        .map(word => {
          const card = cards[word]

          const detail = definitions[word]
          const stripped: TypedWithoutKhmerAndHtml | undefined = detail ? getBestDefinitionHtml(detail) : undefined

          const due = card ? new Date(card.due) : new Date()
          const isDue = due <= new Date()

          return { word, stripped, due, isDue, state: card?.state }
        })
        .sort((a, b) => a.due.getTime() - b.due.getTime())
    }, [items, cards, definitions])

    return (
      <div className="w-1/3 min-w-[250px] max-w-[350px] border-r border-divider flex flex-col bg-content2/50">
        <div className="p-4 font-bold text-lg border-b border-divider flex justify-between items-center">
          <span>Deck ({items.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedList.map(item => (
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
                {item.stripped || '(No Definition)'}
              </div>
              <div className="flex justify-between items-center mt-1">
                <Chip color={item.state === State.New ? 'primary' : 'default'} size="sm" variant="flat">
                  {item.state === State.New
                    ? 'New'
                    : item.state === State.Review
                      ? 'Review'
                      : item.state === State.Relearning
                        ? 'Relearning'
                        : 'Learning'}
                </Chip>
                <span className={clsx('text-[10px]', item.isDue ? 'text-danger font-bold' : 'text-default-400')}>
                  {item.isDue ? 'Due Now' : format(item.due, 'MMM d, HH:mm')}
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
