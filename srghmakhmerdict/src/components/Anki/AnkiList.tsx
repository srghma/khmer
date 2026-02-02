import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import clsx from 'clsx'
import { format } from 'date-fns'
import React, { useMemo } from 'react'
import type { WordDetailKm } from '../../db/dict'
import { State, type Card as FSRSCard } from '@squeakyrobot/fsrs'
import { Chip } from '@heroui/chip'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import {
  Map_toNonEmptyMap_orThrow,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { Map_sortBy, Map_mergeWithRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { getBestDefinitionHtml } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import type { TypedWithoutKhmerAndHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-without-khmer-and-html'

type CardDetail = {
  card: FSRSCard
  detail: WordDetailKm | undefined
  detailShort: TypedWithoutKhmerAndHtml | undefined
  isDue: boolean
}

export function mergeCardAndDefinitionsAndSortByDueDate(
  cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>,
  definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> | undefined,
): NonEmptyMap<TypedContainsKhmer, CardDetail> {
  const card2 = Map_sortBy(cards, (_k: TypedContainsKhmer, v: FSRSCard) => v.due.getTime())
  const m: Map<TypedContainsKhmer, CardDetail> = Map_mergeWithRecord(
    card2,
    definitions || {},
    (card: FSRSCard, detail: WordDetailKm | undefined) => {
      const detailShort = detail ? getBestDefinitionHtml(detail) : undefined
      const isDue = card.due <= new Date()

      return {
        card,
        detail,
        detailShort,
        isDue,
      }
    },
  )

  return Map_toNonEmptyMap_orThrow(m)
}

export const AnkiList = React.memo(
  ({
    cards,
    definitions,
    selectedWord,
    onSelect,
  }: {
    cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
    definitions: NonEmptyRecord<TypedContainsKhmer, WordDetailKm> | undefined
    selectedWord: TypedContainsKhmer | undefined
    onSelect: (word: TypedContainsKhmer) => void
  }) => {
    const sortedList = useMemo(() => mergeCardAndDefinitionsAndSortByDueDate(cards, definitions), [cards, definitions])

    return (
      <div className="w-1/3 min-w-[250px] max-w-[350px] border-r border-divider flex flex-col bg-content2/50">
        <div className="p-4 font-bold text-lg border-b border-divider flex justify-between items-center">
          <span>Deck ({sortedList.size})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Array.from(sortedList).map(([word, card]) => (
            <button
              key={word}
              className={clsx(
                'p-3 rounded-lg cursor-pointer transition-all border text-left flex flex-col gap-1',
                selectedWord === word
                  ? 'bg-primary/10 border-primary shadow-sm'
                  : 'bg-content1 border-transparent hover:border-default-200',
              )}
              onClick={() => onSelect(word)}
            >
              <div className="text-small font-medium text-foreground line-clamp-2 leading-tight">
                {card.detailShort || '(No Definition)'}
              </div>
              <div className="flex justify-between items-center mt-1">
                <Chip color={card.card.state === State.New ? 'primary' : 'default'} size="sm" variant="flat">
                  {card.card.state === State.New
                    ? 'New'
                    : card.card.state === State.Review
                      ? 'Review'
                      : card.card.state === State.Relearning
                        ? 'Relearning'
                        : 'Learning'}
                </Chip>
                <span className={clsx('text-[10px]', card.isDue ? 'text-danger font-bold' : 'text-default-400')}>
                  {card.isDue ? 'Due Now' : format(card.card.due, 'MMM d, HH:mm')}
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
