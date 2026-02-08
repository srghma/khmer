import React, { useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import * as HistoryDb from '../../db/history'
import { LoadingState, EmptyState } from './SharedComponents'
import { HistoryItemRow } from './HistoryItemRow'
import { useListLogic } from './useListLogic'
import { Map_entriesToArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { ConfirmAction } from '../ConfirmAction'
import { historyStore } from '../../externalStores/historyAndFavourites'
import { FavoriteToggleButton } from './FavoriteToggleButton'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const HistoryListOnly: React.FC<ListPropsCommon> = React.memo(({ onSelect, km_map, maybeColorMode }) => {
  const { items, loading, handleDelete, handleClearAll } = useListLogic(
    HistoryDb.getHistory,
    HistoryDb.removeHistoryItem,
    HistoryDb.deleteAllHistory,
    'history',
    historyStore,
  )

  const renderRightAction = useCallback(
    (w: NonEmptyStringTrimmed, l: DictionaryLanguage) => <FavoriteToggleButton mode={l} word={w} />,
    [],
  )

  if (loading) return <LoadingState />
  // If items is undefined, the NonEmptyMap is empty
  if (!items) return <EmptyState type="history" />

  return (
    <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
        <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
          Recent History ({items.size})
        </span>
        <ConfirmAction
          confirmLabel="Clear All"
          title="Clear Search History?"
          trigger={onOpen => (
            <Button
              className="h-8 text-tiny font-medium"
              color="danger"
              size="sm"
              startContent={<FaRegTrashAlt />}
              variant="light"
              onPress={onOpen}
            >
              Clear All
            </Button>
          )}
          onConfirm={handleClearAll}
        >
          <p className="text-small text-default-500">Are you sure you want to delete all {items.size} items?</p>
        </ConfirmAction>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {Map_entriesToArray(items, (word, language) => (
          <HistoryItemRow
            key={`${word}-${language}`}
            km_map={km_map}
            language={language}
            maybeColorMode={maybeColorMode}
            renderRightAction={renderRightAction}
            word={word}
            onDelete={handleDelete}
            onSelect={onSelect}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})

HistoryListOnly.displayName = 'HistoryListOnly'
