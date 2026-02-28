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
import { useListLogic } from './useListLogic'
import { useSettings } from '../../providers/SettingsProvider'
import { ConfirmAction } from '../ConfirmAction'
import { useFavorites } from '../../providers/FavoritesProvider'
import { useI18nContext } from '../../i18n/i18n-react-custom'

import { VirtualizedList } from '../VirtualizedList'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  maybeColorMode: MaybeColorizationMode
}

export const FavoritesListOnly = React.memo(function FavoritesListOnly({ onSelect, maybeColorMode }: ListPropsCommon) {
  const { LL } = useI18nContext()

  const { favorites: items, loading, removeFavorite, deleteAllFavorites } = useFavorites()

  const { handleDelete, handleClearAll } = useListLogic(removeFavorite, deleteAllFavorites)

  const renderItem = useCallback(
    (item: (typeof items)[0]) => (
      <HistoryOrFavoriteItemRow
        language={item.language}
        maybeColorMode={maybeColorMode}
        renderRightAction={undefined}
        word={item.word}
        onDelete={handleDelete}
        onSelect={onSelect}
      />
    ),
    [maybeColorMode, handleDelete, onSelect],
  )

  const { scaling_ui } = useSettings()
  const estimateSize = useCallback(() => (56 * scaling_ui) / 14, [scaling_ui])
  const keyExtractor = useCallback((item: (typeof items)[0]) => `${item.word}-${item.language}`, [])

  const confirmContent = React.useMemo(
    () => (
      <p className="text-small text-default-500">{LL.FAVORITES.CONFIRM_DELETE_ALL({ count: items?.length ?? 0 })}</p>
    ),
    [items?.length, LL],
  )

  if (loading) return <div className="p-4 text-center">{LL.COMMON.LOADING()}</div>

  const hasItems = items.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-content1 overflow-x-hidden text-base">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
        <span className="font-bold uppercase text-default-500 tracking-wider text-small">
          {LL.FAVORITES.TITLE_WITH_COUNT({ count: items.length })}
        </span>
        <div className="flex gap-2">
          <Tooltip content={LL.FAVORITES.OPEN_ANKI()}>
            <Button as={Link} color="secondary" href="/anki" size="sm" variant="flat">
              <span className="font-bold text-base">{LL.FAVORITES.ANKI_BUTTON()}</span>
            </Button>
          </Tooltip>
          <ConfirmAction
            confirmLabel={LL.COMMON.CLEAR_ALL()}
            title={LL.FAVORITES.CLEAR_TITLE()}
            trigger={onOpen => (
              <Button
                className="min-h-8 h-auto font-medium text-base"
                color="danger"
                isDisabled={!hasItems}
                startContent={<FaRegTrashAlt className="text-base" />}
                variant="light"
                onPress={onOpen}
              >
                {LL.COMMON.CLEAR_ALL()}
              </Button>
            )}
            onConfirm={handleClearAll}
          >
            {confirmContent}
          </ConfirmAction>
        </div>
      </div>

      {!hasItems ? (
        <EmptyState type="favorites" />
      ) : (
        <VirtualizedList
          estimateSize={estimateSize}
          items={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      )}
    </div>
  )
})

FavoritesListOnly.displayName = 'FavoritesListOnly'
