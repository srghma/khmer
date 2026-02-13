import React, { useMemo } from 'react'
import { formatDistance } from 'date-fns'
import { getBestDefinitionKhmerFromEn_fromShort } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu_fromShort } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionEnOrRuFromKm_fromShort } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import type { ShortDefinitionEn, ShortDefinitionKm, ShortDefinitionRu } from '../../db/dict/types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { AnkiGameMode } from './types'
import { RenderHtmlColorized } from '../DetailView/atoms'

export type AnkiListItemProps_ShowMode_Map = {
  'km:GUESSING_NON_KHMER': NonEmptyStringTrimmed
  'en:GUESSING_KHMER': NonEmptyStringTrimmed
  'ru:GUESSING_KHMER': NonEmptyStringTrimmed
  'km:GUESSING_KHMER': ShortDefinitionKm
  'en:GUESSING_NON_KHMER': ShortDefinitionEn
  'ru:GUESSING_NON_KHMER': ShortDefinitionRu
}

export type AnkiListItemProps_ShowMode = {
  [K in AnkiGameMode]: { t: K; v: AnkiListItemProps_ShowMode_Map[K] }
}[AnkiGameMode]

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
  const notDueButWillSeeIn2MinutesOrLess = card_due <= now + 2 * 60000
  const notDueButWillSeeIn5MinutesOrLess = card_due <= now + 5 * 60000

  const displayLabel = useMemo(() => {
    switch (t) {
      // Modes where we show the Word directly
      case 'km:GUESSING_NON_KHMER': {
        return (
          <RenderHtmlColorized
            hideBrokenImages_enable={false}
            html={v}
            isKhmerLinksEnabled_ifTrue_passOnNavigateKm={undefined}
            isKhmerWordsHidingEnabled={false}
            isNonKhmerWordsHidingEnabled={false}
          />
        )
      }
      case 'en:GUESSING_KHMER':
      case 'ru:GUESSING_KHMER':
        return <span className="font-bold text-foreground">{v}</span>

      // Modes where we process the Description
      case 'km:GUESSING_KHMER': {
        // Mode 2: Clue is Desc (Km) -> Show Desc without Khmer Chars.
        const val = getBestDefinitionEnOrRuFromKm_fromShort(v)

        if (!val) return '...'

        return (
          <RenderHtmlColorized
            hideBrokenImages_enable={false}
            html={val}
            isKhmerLinksEnabled_ifTrue_passOnNavigateKm={undefined}
            isKhmerWordsHidingEnabled={false}
            isNonKhmerWordsHidingEnabled={false}
          />
        )
      }
      case 'en:GUESSING_NON_KHMER': {
        // Mode 4: Clue is Desc (En). Remove non-khmer chars -> Shows Khmer Text.
        const val = getBestDefinitionKhmerFromEn_fromShort(v)

        if (!val) return '...'

        return (
          <RenderHtmlColorized
            hideBrokenImages_enable={false}
            html={val}
            isKhmerLinksEnabled_ifTrue_passOnNavigateKm={undefined}
            isKhmerWordsHidingEnabled={false}
            isNonKhmerWordsHidingEnabled={false}
          />
        )
      }
      case 'ru:GUESSING_NON_KHMER': {
        // Mode 6: Clue is Desc (Ru). Remove non-khmer chars -> Shows Khmer Text.
        const val = getBestDefinitionKhmerFromRu_fromShort(v)

        if (!val) return '...'

        return (
          <RenderHtmlColorized
            hideBrokenImages_enable={false}
            html={val}
            isKhmerLinksEnabled_ifTrue_passOnNavigateKm={undefined}
            isKhmerWordsHidingEnabled={false}
            isNonKhmerWordsHidingEnabled={false}
          />
        )
      }
      default:
        return null
    }
  }, [t, v])

  const dueLabel = useMemo(() => {
    const distance = formatDistance(card_due, now, { addSuffix: false })
    // User requested: "-1 day" if due (past), "1 day" if future.
    // formatDistance without suffix gives "1 day".
    // We append - if due.

    const text = isDue ? `-${distance}` : distance
    const colorClass = isDue
      ? 'text-danger'
      : notDueButWillSeeIn2MinutesOrLess
        ? 'text-warning'
        : notDueButWillSeeIn5MinutesOrLess
          ? 'text-secondary'
          : 'text-primary' // Red vs Blue

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
