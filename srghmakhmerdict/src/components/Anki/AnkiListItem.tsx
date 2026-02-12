import React, { useMemo } from 'react'
import { formatDistance } from 'date-fns'
import { getBestDefinitionKhmerFromEn_fromShort } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu_fromShort } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionHtml_fromShort } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import type { ShortDefinitionEn, ShortDefinitionKm, ShortDefinitionRu } from '../../db/dict/types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

type AnkiListItemProps_ShowMode =
  // Modes 1, 3, 5: Clue is the Word
  | { t: 'GUESS_NON_KHMER_km'; v: NonEmptyStringTrimmed }
  | { t: 'GUESS_KHMER_en'; v: NonEmptyStringTrimmed }
  | { t: 'GUESS_KHMER_ru'; v: NonEmptyStringTrimmed }
  // Modes 2, 4, 6: Clue is the cleaned Description
  | { t: 'GUESS_KHMER_km'; v: ShortDefinitionKm }
  | { t: 'GUESS_NON_KHMER_en'; v: ShortDefinitionEn }
  | { t: 'GUESS_NON_KHMER_ru'; v: ShortDefinitionRu }

interface AnkiListItemProps_Common {
  card_due: number
  now: number
  isSelected: boolean
  onSelect: () => void
}

export type AnkiListItemProps = AnkiListItemProps_Common & AnkiListItemProps_ShowMode

export const AnkiListItem = React.memo(function AnkiListItem(props: AnkiListItemProps) {
  const { card_due, isSelected, onSelect, now, t, v } = props

  const isDue = card_due <= now

  const displayLabel = useMemo(() => {
    switch (t) {
      // Modes where we show the Word directly
      case 'GUESS_NON_KHMER_km':
        return <span className="font-bold font-khmer text-foreground">{v}</span>
      case 'GUESS_KHMER_en':
      case 'GUESS_KHMER_ru':
        return <span className="font-bold text-foreground">{v}</span>

      // Modes where we process the Description
      case 'GUESS_KHMER_km': {
        const val = getBestDefinitionHtml_fromShort(v)

        return <span className="text-sm text-default-600 line-clamp-2">{val || '...'}</span>
      }
      case 'GUESS_NON_KHMER_en': {
        const val = getBestDefinitionKhmerFromEn_fromShort(v)

        return <span className="font-khmer text-primary">{val || '...'}</span>
      }
      case 'GUESS_NON_KHMER_ru': {
        const val = getBestDefinitionKhmerFromRu_fromShort(v)

        return <span className="font-khmer text-primary">{val || '...'}</span>
      }
      default:
        return null
    }
  }, [t, v])

  const dueLabel = useMemo(() => {
    const distance = formatDistance(card_due, now, { addSuffix: true })

    return (
      <div className="flex flex-col items-end gap-0.5">
        {isDue && <span className="text-[10px] font-black uppercase tracking-wider text-danger leading-none">Due</span>}
        <span className={`text-tiny whitespace-nowrap ${isDue ? 'text-danger/80 font-medium' : 'text-default-400'}`}>
          {distance}
        </span>
      </div>
    )
  }, [card_due, now, isDue])

  const containerClassName = useMemo(() => {
    const base =
      'w-full cursor-pointer px-4 py-3 border-b border-divider transition-all text-left flex justify-between items-start gap-3'
    const bg = isSelected
      ? 'bg-secondary-100 dark:bg-secondary-900/40'
      : isDue
        ? 'bg-danger-50/30 hover:bg-danger-50/50 dark:bg-danger-900/10 dark:hover:bg-danger-900/20'
        : 'hover:bg-default-100'
    const border = isDue && !isSelected ? 'border-l-4 border-l-danger/50' : 'border-l-4 border-l-transparent'

    return `${base} ${bg} ${border}`
  }, [isSelected, isDue])

  return (
    <button className={containerClassName} onClick={onSelect}>
      <div className="flex-1 min-w-0 break-words">{displayLabel}</div>
      <div className="shrink-0 pt-0.5">{dueLabel}</div>
    </button>
  )
})

AnkiListItem.displayName = 'AnkiListItem'
