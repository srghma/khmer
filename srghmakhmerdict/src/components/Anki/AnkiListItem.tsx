import React, { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { AnkiDirection } from './types'
import { getBestDefinitionKhmerFromEn_fromShort } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu_fromShort } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionHtml_fromShort } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import { Spinner } from '@heroui/spinner'
import { type FavoriteItem } from '../../db/favorite/item'
import type { LanguageToShortDefinitionSum } from '../../db/dict/types'

interface AnkiListItemProps {
  card: FavoriteItem
  description: LanguageToShortDefinitionSum | undefined
  direction: AnkiDirection
  isSelected: boolean
  onSelect: (card: FavoriteItem) => void
}

export const AnkiListItem = React.memo(({ card, description, direction, isSelected, onSelect }: AnkiListItemProps) => {
  const { word, language, due } = card

  const displayLabel = useMemo(() => {
    // Logic: What is the "Front" of the card?
    const isKmDict = language === 'km'

    // Condition to show the WORD directly:
    // 1. EN/RU Dict + Guessing Khmer (See EN Word, Guess KM)
    // 2. KM Dict + Guessing Non-Khmer (See KM Word, Guess Def)
    const showWord = (!isKmDict && direction === 'GUESSING_KHMER') || (isKmDict && direction === 'GUESSING_NON_KHMER')

    if (showWord) {
      return <span className="font-bold text-foreground">{word}</span>
    }

    // Otherwise, we show the Definition (Khmer translation or HTML def)
    if (!description) {
      if (!description) return <Spinner color="current" size="sm" /> // Should likely not happen if mandatory
    }

    if (description.t === 'en') {
      // Show extracted Khmer
      const val = getBestDefinitionKhmerFromEn_fromShort(description.v)

      return <span className="font-khmer text-foreground">{val || '...'}</span>
    }

    if (description.t === 'ru') {
      // Show extracted Khmer
      const val = getBestDefinitionKhmerFromRu_fromShort(description.v)

      return <span className="font-khmer text-foreground">{val || '...'}</span>
    }

    if (description.t === 'km') {
      // Show Definition (stripped HTML)
      const val = getBestDefinitionHtml_fromShort(description.v)

      return <span className="text-sm text-foreground-500 line-clamp-2">{val || '...'}</span>
    }

    return word
  }, [direction, word, language, description])

  const dueLabel = useMemo(() => {
    const now = Date.now()

    if (due < now) return <span className="text-danger font-bold text-tiny">Due</span>

    return <span className="text-tiny text-default-400">{formatDistanceToNow(due, { addSuffix: true })}</span>
  }, [due])

  return (
    <button
      className={`
        cursor-pointer px-4 py-3 border-b border-divider transition-colors
        ${isSelected ? 'bg-secondary-100 dark:bg-secondary-900/30' : 'hover:bg-default-100'}
      `}
      onClick={() => onSelect(card)}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 break-words">{displayLabel}</div>
        <div className="shrink-0 flex flex-col items-end">{dueLabel}</div>
      </div>
    </button>
  )
})

AnkiListItem.displayName = 'AnkiListItem'
