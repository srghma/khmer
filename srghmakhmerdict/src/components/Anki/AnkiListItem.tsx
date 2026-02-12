import React, { useMemo } from 'react'
import { formatDistance } from 'date-fns'
import { getBestDefinitionKhmerFromEn_fromShort } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu_fromShort } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionHtml_fromShort } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import type { ShortDefinitionEn, ShortDefinitionKm, ShortDefinitionRu } from '../../db/dict/types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml } from '../../utils/text-processing/html'

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
  km_map: KhmerWordsMap
}

export type AnkiListItemProps = AnkiListItemProps_Common & AnkiListItemProps_ShowMode

export const AnkiListItem = React.memo(function AnkiListItem(props: AnkiListItemProps) {
  const { card_due, isSelected, onSelect, now, t, v, km_map } = props

  const isDue = card_due <= now

  const displayLabel = useMemo(() => {
    switch (t) {
      // Modes where we show the Word directly
      case 'GUESS_NON_KHMER_km': {
        // Mode 1: Clue is Word (Km).
        const html = colorizeHtml(v, 'segmenter', km_map)

        return <span dangerouslySetInnerHTML={{ __html: html }} className="font-bold font-khmer text-foreground" />
      }
      case 'GUESS_KHMER_en':
      case 'GUESS_KHMER_ru':
        return <span className="font-bold text-foreground">{v}</span>

      // Modes where we process the Description
      case 'GUESS_KHMER_km': {
        // Mode 2: Clue is Desc (Km) -> Show Desc without Khmer Chars.
        const val = getBestDefinitionHtml_fromShort(v)
        const html = val ? colorizeHtml(val, 'segmenter', km_map) : '...'

        return <span dangerouslySetInnerHTML={{ __html: html }} className="text-sm text-default-600 line-clamp-2" />
      }
      case 'GUESS_NON_KHMER_en': {
        // Mode 4: Clue is Desc (En). Remove non-khmer chars -> Shows Khmer Text.
        const val = getBestDefinitionKhmerFromEn_fromShort(v)

        if (!val) return <span className="font-khmer text-primary">...</span>
        const html = colorizeHtml(val, 'segmenter', km_map)

        return <span dangerouslySetInnerHTML={{ __html: html }} className="font-khmer text-primary" />
      }
      case 'GUESS_NON_KHMER_ru': {
        // Mode 6: Clue is Desc (Ru). Remove non-khmer chars -> Shows Khmer Text.
        const val = getBestDefinitionKhmerFromRu_fromShort(v)

        if (!val) return <span className="font-khmer text-primary">...</span>
        const html = colorizeHtml(val, 'segmenter', km_map)

        return <span dangerouslySetInnerHTML={{ __html: html }} className="font-khmer text-primary" />
      }
      default:
        return null
    }
  }, [t, v, km_map])

  const dueLabel = useMemo(() => {
    const distance = formatDistance(card_due, now, { addSuffix: false })
    // User requested: "-1 day" if due (past), "1 day" if future.
    // formatDistance without suffix gives "1 day".
    // We append - if due.

    const text = isDue ? `-${distance}` : distance
    const colorClass = isDue ? 'text-danger' : 'text-primary' // Red vs Blue

    return (
      <div className="flex flex-col items-end gap-0.5 ml-auto shrink-0 pl-2">
        {isDue && <span className="text-[10px] font-black uppercase tracking-wider text-danger leading-none">Due</span>}
        <span className={`text-tiny whitespace-nowrap font-medium ${colorClass}`}>{text}</span>
      </div>
    )
  }, [card_due, now, isDue])

  const containerClassName = useMemo(() => {
    const base =
      'w-full cursor-pointer px-4 py-3 border-b border-divider transition-all text-left flex justify-between items-start gap-1'
    const bg = isSelected
      ? 'bg-secondary-100 dark:bg-secondary-900/40' // Active state
      : isDue
        ? 'bg-danger-50/30 hover:bg-danger-50/50 dark:bg-danger-900/10 dark:hover:bg-danger-900/20' // Due state
        : 'hover:bg-default-100' // Default state
    const border = isDue && !isSelected ? 'border-l-4 border-l-danger/50' : 'border-l-4 border-l-transparent'

    return `${base} ${bg} ${border}`
  }, [isSelected, isDue])

  return (
    <button className={containerClassName} onClick={onSelect}>
      <div className="flex-1 min-w-0 break-words pr-2">{displayLabel}</div>
      {dueLabel}
    </button>
  )
})

AnkiListItem.displayName = 'AnkiListItem'
