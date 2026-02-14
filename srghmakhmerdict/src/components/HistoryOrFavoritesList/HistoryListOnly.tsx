import React, { useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState, LoadingState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useListLogic } from './useListLogic'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { ConfirmAction } from '../ConfirmAction'
import { useHistory } from '../../providers/HistoryProvider'
import { FavoriteToggleButton } from './FavoriteToggleButton'

interface HistoryListOnlyProps {
  maybeColorMode: MaybeColorizationMode
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const HistoryListOnly = React.memo(({ maybeColorMode, onNavigate }: HistoryListOnlyProps) => {
  const { LL } = useI18nContext()
  const { history: items, loading, removeHistoryItem, deleteAllHistory } = useHistory()
  const { handleDelete, handleClearAll } = useListLogic(removeHistoryItem, deleteAllHistory)
  const renderRightAction = useCallback(
    (w: NonEmptyStringTrimmed, l: DictionaryLanguage) => <FavoriteToggleButton mode={l} word={w} />,
    [],
  )

  const confirmContent = useMemo(
    () => <p className="text-small text-default-500">{LL.HISTORY.CONFIRM_DELETE_ALL({ count: items?.length ?? 0 })}</p>,
    [items?.length, LL],
  )

  const renderClearAllTrigger = useCallback(
    (onOpen: () => void) => (
      <Button
        className="h-8 text-tiny font-medium"
        color="danger"
        size="sm"
        startContent={<FaRegTrashAlt />}
        variant="light"
        onPress={onOpen}
      >
        {LL.COMMON.CLEAR_ALL()}
      </Button>
    ),
    [LL],
  )

  if (loading) {
    return <LoadingState />
  }

  if (items.length === 0) {
    return <EmptyState type="history" />
  }

  return (
    <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
        <h2 className="text-tiny font-bold uppercase text-default-500 tracking-wider">
          {LL.HISTORY.RECENT_TITLE_WITH_COUNT({ count: items.length })}
        </h2>
        <ConfirmAction
          confirmLabel={LL.COMMON.CLEAR_ALL()}
          title={LL.HISTORY.CLEAR_TITLE()}
          trigger={renderClearAllTrigger}
          onConfirm={handleClearAll}
        >
          {confirmContent}
        </ConfirmAction>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map(({ word, language }) => (
            <HistoryOrFavoriteItemRow
              key={`${word}-${language}`}
              language={language}
              maybeColorMode={maybeColorMode}
              renderRightAction={renderRightAction}
              word={word}
              onDelete={handleDelete}
              onSelect={onNavigate}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
})

HistoryListOnly.displayName = 'HistoryListOnly'
