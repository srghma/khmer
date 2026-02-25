import React, { useCallback, useMemo } from 'react'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useSettings } from '../../providers/SettingsProvider'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState, LoadingState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useListLogic } from './useListLogic'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { ConfirmAction } from '../ConfirmAction'
import { useHistory } from '../../providers/HistoryProvider'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { VirtualizedList } from '../VirtualizedList'

import { ExportHistoryModal } from './ExportHistoryModal'

interface HistoryListOnlyProps {
  maybeColorMode: MaybeColorizationMode
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const HistoryListOnly = React.memo(function HistoryListOnly({
  maybeColorMode,
  onNavigate,
}: HistoryListOnlyProps) {
  const { LL } = useI18nContext()
  const { history: items, loading, removeHistoryItem, deleteAllHistory } = useHistory()
  const { handleDelete, handleClearAll } = useListLogic(removeHistoryItem, deleteAllHistory)

  const renderRightAction = useCallback(
    (w: NonEmptyStringTrimmed, l: DictionaryLanguage) => <FavoriteToggleButton mode={l} word={w} />,
    [],
  )

  const renderItem = useCallback(
    (item: (typeof items)[0]) => (
      <HistoryOrFavoriteItemRow
        language={item.language}
        maybeColorMode={maybeColorMode}
        renderRightAction={renderRightAction}
        word={item.word}
        onDelete={handleDelete}
        onSelect={onNavigate}
      />
    ),
    [maybeColorMode, renderRightAction, handleDelete, onNavigate],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(() => (56 * scaling_ui) / 14, [scaling_ui])
  const keyExtractor = useCallback((item: (typeof items)[0]) => `${item.word}-${item.language}`, [])

  const confirmContent = useMemo(
    () => <p className="text-small text-default-500">{LL.HISTORY.CONFIRM_DELETE_ALL({ count: items?.length ?? 0 })}</p>,
    [items?.length, LL],
  )

  const renderClearAllTrigger = useCallback(
    (onOpen: () => void) => (
      <Button
        className="min-h-8 h-auto font-medium text-base"
        color="danger"
        size="sm"
        startContent={<FaRegTrashAlt className="text-base" />}
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
    <div className="flex-1 flex flex-col min-h-0 bg-content1 overflow-x-hidden text-base">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
        <h2 className="font-bold uppercase text-default-500 tracking-wider text-small">
          {LL.HISTORY.RECENT_TITLE_WITH_COUNT({ count: items.length })}
        </h2>
        <div className="flex items-center gap-1">
          <ExportHistoryModal items={items} />
          <ConfirmAction
            confirmLabel={LL.COMMON.CLEAR_ALL()}
            title={LL.HISTORY.CLEAR_TITLE()}
            trigger={renderClearAllTrigger}
            onConfirm={handleClearAll}
          >
            {confirmContent}
          </ConfirmAction>
        </div>
      </div>

      <VirtualizedList estimateSize={estimateSize} items={items} keyExtractor={keyExtractor} renderItem={renderItem} />
    </div>
  )
})

HistoryListOnly.displayName = 'HistoryListOnly'
