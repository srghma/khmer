import React, { useMemo, useCallback, useSyncExternalStore } from 'react'
import { AnkiListItem, type AnkiListItemProps_ShowMode } from './AnkiListItem'
import type { KhmerWordsMap } from '../../db/dict'
import { motion, AnimatePresence } from 'framer-motion'
import { type GameModeAndData } from './useAnkiGameManagerInitialData'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useSettings } from '../../providers/SettingsProvider'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

interface AnkiListContentProps {
  data: GameModeAndData
  selectedId: NonEmptyStringTrimmed | undefined
  onSelect: (id: NonEmptyStringTrimmed) => void
  km_map: KhmerWordsMap
}

const motion_initial = { opacity: 0 }
const motion_animate = { opacity: 1 }
const motion_exit = { opacity: 0 }

const AnkiListContentItem = React.memo(function AnkiListContentItem({
  id,
  due,
  isSelected,
  km_map,
  now,
  t,
  v,
  maybeColorMode,
  onSelect,
}: {
  id: NonEmptyStringTrimmed
  due: number
  isSelected: boolean
  km_map: KhmerWordsMap
  now: number
  maybeColorMode: MaybeColorizationMode
  onSelect: (id: NonEmptyStringTrimmed) => void
} & AnkiListItemProps_ShowMode) {
  const handleSelect = useCallback(() => onSelect(id), [onSelect, id])

  return (
    <motion.div layout animate={motion_animate} exit={motion_exit} initial={motion_initial}>
      <AnkiListItem
        card_due={due}
        isSelected={isSelected}
        km_map={km_map}
        maybeColorMode={maybeColorMode}
        now={now}
        t={t}
        v={v as any}
        onSelect={handleSelect}
      />
    </motion.div>
  )
})

export const AnkiListContent = React.memo(function AnkiListContent({
  data,
  selectedId,
  onSelect,
  km_map,
}: AnkiListContentProps) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)
  const { maybeColorMode } = useSettings()

  const listItems = useMemo(() => {
    switch (data.t) {
      case 'km:GUESS_NON_KHMER':
      case 'en:GUESS_KHMER':
      case 'ru:GUESS_KHMER':
        return data.v.map(item => (
          <AnkiListContentItem
            key={item.word}
            due={item.due}
            id={item.word}
            isSelected={selectedId === item.word}
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            now={now}
            t={data.t}
            v={item.word}
            onSelect={onSelect}
          />
        ))
      case 'km:GUESS_KHMER':
      case 'en:GUESS_NON_KHMER':
      case 'ru:GUESS_NON_KHMER':
        return data.v.map(({ card, description }) => (
          <AnkiListContentItem
            key={card.word}
            due={card.due}
            id={card.word}
            isSelected={selectedId === card.word}
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            now={now}
            t={data.t}
            v={description as any}
            onSelect={onSelect}
          />
        ))
      default:
        assertNever(data)
    }
  }, [data, selectedId, now, onSelect, km_map, maybeColorMode])

  return (
    <div key={data.t} className="flex-1 overflow-y-auto w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <AnimatePresence initial={false} mode="popLayout">
        {listItems}
      </AnimatePresence>
    </div>
  )
})

AnkiListContent.displayName = 'AnkiListContent'
