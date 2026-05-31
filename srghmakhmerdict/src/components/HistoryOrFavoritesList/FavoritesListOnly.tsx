import React, { useCallback } from 'react'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/react'
import { Link } from 'wouter'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useSettings } from '../../providers/SettingsProvider'
import { ConfirmAction } from '../ConfirmAction'
import { useFavorites } from '../../providers/FavoritesProvider'
import { useI18nContext } from '../../i18n/i18n-react-custom'

import { VirtualizedList } from '../VirtualizedList'
import { ListFilterModal } from './ListFilterModal'
import { useSharedListLogic } from './useSharedListLogic'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  maybeColorMode: MaybeColorizationMode
}

export const FavoritesListOnly = React.memo(function FavoritesListOnly({ onSelect, maybeColorMode }: ListPropsCommon) {
  const { LL } = useI18nContext()

  const { favorites: items, loading, removeFavorite, deleteAllFavorites } = useFavorites()

  const {
    listRef,
    filteredItems,
    filters,
    setFilters,
    selectedKeys,
    hasSelection,
    titleText,
    handleNavigate,
    handleToggleSelection,
    handleSelectAll,
    handleDeselectAll,
    handleDeleteItem,
    handleClearSelectedOrAll,
  } = useSharedListLogic({
    items,
    storageKeyPrefix: 'favorites',
    onNavigate: onSelect,
    removeFn: removeFavorite,
    clearAllFn: deleteAllFavorites,
  })

  const renderItem = useCallback(
    (item: (typeof items)[0]) => (
      <HistoryOrFavoriteItemRow
        isSelected={selectedKeys.has(`${item.word}-${item.language}`)}
        language={item.language}
        maybeColorMode={maybeColorMode}
        renderRightAction={undefined}
        selectionMode={hasSelection}
        word={item.word}
        onDelete={handleDeleteItem}
        onSelect={handleNavigate}
        onToggleSelection={handleToggleSelection}
      />
    ),
    [maybeColorMode, handleDeleteItem, handleNavigate, selectedKeys, hasSelection, handleToggleSelection],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(() => (56 * scaling_ui) / 14, [scaling_ui])
  const keyExtractor = useCallback((item: (typeof items)[0]) => `${item.word}-${item.language}`, [])

  const confirmContent = React.useMemo(
    () => (
      <p className="text-small text-default-500">
        {hasSelection
          ? 'Delete selected items?'
          : LL.FAVORITES.CONFIRM_DELETE_ALL({ count: filteredItems?.length ?? 0 })}
      </p>
    ),
    [filteredItems?.length, LL, hasSelection],
  )

  if (loading) return <div className="p-4 text-center">{LL.COMMON.LOADING()}</div>

  const hasItems = filteredItems.length > 0
  const allSelected = hasSelection && selectedKeys.size === filteredItems.length

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-content1 overflow-x-hidden text-base">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm overflow-x-auto no-scrollbar gap-4">
        <span className="font-bold uppercase text-default-500 tracking-wider text-small whitespace-nowrap">
          {titleText}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {filters && <ListFilterModal filters={filters} onChange={setFilters as any} />}
          {hasSelection && (
            <Button
              className="min-h-8 h-auto font-medium text-base"
              color="default"
              size="sm"
              variant="flat"
              onPress={allSelected ? handleDeselectAll : handleSelectAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          {!hasSelection && (
            <Tooltip content={LL.FAVORITES.OPEN_ANKI()}>
              <Button as={Link} color="secondary" href="/anki" size="sm" variant="flat">
                <span className="font-bold text-base">{LL.FAVORITES.ANKI_BUTTON()}</span>
              </Button>
            </Tooltip>
          )}
          <ConfirmAction
            confirmLabel={hasSelection ? 'Clear Selected' : LL.COMMON.CLEAR_ALL()}
            title={hasSelection ? 'Clear Selected' : LL.FAVORITES.CLEAR_TITLE()}
            trigger={onOpen => (
              <Button
                className="min-h-8 h-auto font-medium text-base"
                color="danger"
                isDisabled={!hasItems}
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
        <EmptyState type="favorites" />
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

FavoritesListOnly.displayName = 'FavoritesListOnly'
