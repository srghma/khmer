import React, { useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict/index'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useListLogic } from './useListLogic'
import { ConfirmAction } from '../ConfirmAction'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { useHistory } from '../../providers/HistoryProvider'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const HistoryListOnly: React.FC<ListPropsCommon> = React.memo(({ onSelect, km_map, maybeColorMode }) => {
  const { history: items, loading, removeHistoryItem, deleteAllHistory } = useHistory()

  const { handleDelete, handleClearAll } = useListLogic(removeHistoryItem, deleteAllHistory)

  const renderRightAction = useCallback(
    (w: NonEmptyStringTrimmed, l: DictionaryLanguage) => <FavoriteToggleButton mode={l} word={w} />,
    [],
  )

  const confirmContent = React.useMemo(
    () => <p className="text-small text-default-500">Are you sure you want to delete all {items?.length} items?</p>,
    [items?.length],
  )

  if (loading) return <div className="p-4 text-center">Loading...</div>
  // If items is undefined, the NonEmptyMap is empty
  if (!items || items.length === 0) return <EmptyState type="history" />

  return (
    <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
        <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
          Recent History ({items.length})
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
          {confirmContent}
        </ConfirmAction>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {items.map(({ word, language }) => (
          <HistoryOrFavoriteItemRow
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
