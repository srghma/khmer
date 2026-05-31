import React, { useCallback } from 'react'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useSettings } from '../../providers/SettingsProvider'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState, LoadingState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { ConfirmAction } from '../ConfirmAction'
import { useHistory } from '../../providers/HistoryProvider'
import { FavoriteToggleButton } from './FavoriteToggleButton'
import { VirtualizedList } from '../VirtualizedList'

import { ExportHistoryModal } from './ExportHistoryModal'
import { ListFilterModal } from './ListFilterModal'
import { useSharedListLogic } from './useSharedListLogic'

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

  const {
    listRef,
    filteredItems,
    filters,
    setFilters,
    selectedKeys,
    hasSelection,
    itemsToExport,
    titleText,
    handleNavigate,
    handleToggleSelection,
    handleDeleteItem,
    handleClearSelectedOrAll,
  } = useSharedListLogic({
    items,
    onNavigate,
    removeFn: removeHistoryItem,
    clearAllFn: deleteAllHistory,
  })

  const renderRightAction = useCallback(
    (w: NonEmptyStringTrimmed, l: DictionaryLanguage) => <FavoriteToggleButton mode={l} word={w} />,
    [],
  )

  const renderItem = useCallback(
    (item: (typeof items)[0]) => (
      <HistoryOrFavoriteItemRow
        isSelected={selectedKeys.has(`${item.word}-${item.language}`)}
        language={item.language}
        maybeColorMode={maybeColorMode}
        renderRightAction={renderRightAction}
        selectionMode={hasSelection}
        word={item.word}
        onDelete={handleDeleteItem}
        onSelect={handleNavigate}
        onToggleSelection={handleToggleSelection}
      />
    ),
    [
      maybeColorMode,
      renderRightAction,
      handleDeleteItem,
      handleNavigate,
      selectedKeys,
      hasSelection,
      handleToggleSelection,
    ],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(() => (56 * scaling_ui) / 14, [scaling_ui])
  const keyExtractor = useCallback((item: (typeof items)[0]) => `${item.word}-${item.language}`, [])

  const confirmContent = React.useMemo(
    () => (
      <p className="text-small text-default-500">
        {hasSelection ? 'Delete selected items?' : LL.HISTORY.CONFIRM_DELETE_ALL({ count: filteredItems?.length ?? 0 })}
      </p>
    ),
    [filteredItems?.length, LL, hasSelection],
  )

  if (loading) {
    return <LoadingState />
  }

  const hasItems = filteredItems.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-content1 overflow-x-hidden text-base">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm overflow-x-auto no-scrollbar gap-4">
        <h2 className="font-bold uppercase text-default-500 tracking-wider text-small whitespace-nowrap">
          {titleText}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          {filters && <ListFilterModal filters={filters} onChange={setFilters as any} />}
          <ExportHistoryModal isDisabled={!hasItems} items={itemsToExport} />
          <ConfirmAction
            confirmLabel={hasSelection ? 'Clear Selected' : LL.COMMON.CLEAR_ALL()}
            title={hasSelection ? 'Clear Selected' : LL.HISTORY.CLEAR_TITLE()}
            trigger={onOpen => (
              <Button
                className="min-h-8 h-auto font-medium text-base"
                color="danger"
                isDisabled={!hasItems}
                size="sm"
                startContent={<FaRegTrashAlt className="text-base" />}
                variant="light"
                onPress={onOpen}
              >
                {hasSelection ? 'Clear Selected' : LL.COMMON.CLEAR_ALL()}
              </Button>
            )}
            onConfirm={handleClearSelectedOrAll}
          >
            {confirmContent}
          </ConfirmAction>
        </div>
      </div>

      {!hasItems ? (
        <EmptyState type="history" />
      ) : (
        <VirtualizedList
          ref={listRef}
          estimateSize={estimateSize}
          items={filteredItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      )}
    </div>
  )
})

HistoryListOnly.displayName = 'HistoryListOnly'
