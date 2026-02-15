import React, { useCallback, useSyncExternalStore } from 'react'
import { AnkiListItem, type AnkiListItemProps_ShowMode } from './AnkiListItem'
import { type GameModeAndData } from './useAnkiGameManagerInitialData'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { VirtualizedList } from '../VirtualizedList'
import { useAnkiNavigation } from './useAnkiNavigation'
import { useSettings } from '../../providers/SettingsProvider'

interface AnkiListContentProps {
  data: GameModeAndData
  selectedId: NonEmptyStringTrimmed | undefined
}

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

  return <AnkiListItem card_due={due} isSelected={isSelected} now={now} t={t} v={v as any} onSelect={handleSelect} />
})

export const AnkiListContent = React.memo(function AnkiListContent({ data, selectedId }: AnkiListContentProps) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  const renderItem = useCallback(
    (item: (typeof data)['v'][0]) => {
      let card: { due: number; word: NonEmptyStringTrimmed }
      let v: any

      if ('card' in item) {
        card = item.card
        v = item.description
      } else {
        card = item
        v = item.word
      }

      return (
        <AnkiListContentItem
          due={card.due}
          id={card.word}
          isSelected={selectedId === card.word}
          now={now}
          t={data.t}
          v={v}
        />
      )
    },
    [data.t, selectedId, now],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(() => (54 * scaling_ui) / 14, [scaling_ui])
  const keyExtractor = useCallback((item: (typeof data)['v'][0]) => {
    if ('card' in item) return item.card.word

    return item.word
  }, [])

  return (
    <div key={data.t} className="flex-1 flex flex-col w-full min-h-0 bg-content1">
      <VirtualizedList estimateSize={estimateSize} items={data.v} keyExtractor={keyExtractor} renderItem={renderItem} />
    </div>
  )
})

AnkiListContent.displayName = 'AnkiListContent'
