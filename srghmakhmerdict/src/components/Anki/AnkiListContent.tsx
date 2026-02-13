import React, { useMemo, useCallback, useSyncExternalStore } from 'react'
import { AnkiListItem, type AnkiListItemProps_ShowMode } from './AnkiListItem'
import { motion, AnimatePresence } from 'framer-motion'
import { type GameModeAndData } from './useAnkiGameManagerInitialData'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useAnkiNavigation } from './useAnkiNavigation'

interface AnkiListContentProps {
  data: GameModeAndData
  selectedId: NonEmptyStringTrimmed | undefined
}

const motion_initial = { opacity: 0 }
const motion_animate = { opacity: 1 }
const motion_exit = { opacity: 0 }

const AnkiListContentItem = React.memo(function AnkiListContentItem({
  id,
  due,
  isSelected,
  now,
  t,
  v,
}: {
  id: NonEmptyStringTrimmed
  due: number
  isSelected: boolean
  now: number
} & AnkiListItemProps_ShowMode) {
  const { navigateToWord } = useAnkiNavigation()
  const handleSelect = useCallback(() => navigateToWord(id), [navigateToWord, id])

  return (
    <motion.div layout animate={motion_animate} exit={motion_exit} initial={motion_initial}>
      <AnkiListItem card_due={due} isSelected={isSelected} now={now} t={t} v={v as any} onSelect={handleSelect} />
    </motion.div>
  )
})

export const AnkiListContent = React.memo(function AnkiListContent({ data, selectedId }: AnkiListContentProps) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  const listItems = useMemo(() => {
    switch (data.t) {
      case 'km:GUESSING_NON_KHMER':
      case 'en:GUESSING_KHMER':
      case 'ru:GUESSING_KHMER':
        return data.v.map(item => (
          <AnkiListContentItem
            key={item.word}
            due={item.due}
            id={item.word}
            isSelected={selectedId === item.word}
            now={now}
            t={data.t}
            v={item.word}
          />
        ))
      case 'km:GUESSING_KHMER':
      case 'en:GUESSING_NON_KHMER':
      case 'ru:GUESSING_NON_KHMER':
        return data.v.map(({ card, description }) => (
          <AnkiListContentItem
            key={card.word}
            due={card.due}
            id={card.word}
            isSelected={selectedId === card.word}
            now={now}
            t={data.t}
            v={description as any}
          />
        ))
      default:
        assertNever(data)
    }
  }, [data, selectedId, now])

  return (
    <div key={data.t} className="flex-1 overflow-y-auto w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <AnimatePresence initial={false} mode="popLayout">
        {listItems}
      </AnimatePresence>
    </div>
  )
})

AnkiListContent.displayName = 'AnkiListContent'
