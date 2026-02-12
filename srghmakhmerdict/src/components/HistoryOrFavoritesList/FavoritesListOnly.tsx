import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/react'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { EmptyState } from './SharedComponents'
import { HistoryOrFavoriteItemRow } from './HistoryOrFavoriteItemRow'
import { useListLogic } from './useListLogic'
import { ConfirmAction } from '../ConfirmAction'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useFavorites } from '../../providers/FavoritesProvider'

import { Link } from 'wouter'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  maybeColorMode: MaybeColorizationMode
}

export const FavoritesListOnly = React.memo(function FavoritesListOnly({ onSelect, maybeColorMode }: ListPropsCommon) {
  const dictData = useDictionary()

  const { favorites: items, loading, removeFavorite, deleteAllFavorites } = useFavorites()

  const { handleDelete, handleClearAll } = useListLogic(removeFavorite, deleteAllFavorites)

  const confirmContent = React.useMemo(
    () => <p className="text-small text-default-500">Are you sure you want to delete all {items?.length} items?</p>,
    [items?.length],
  )

  if (loading) return <div className="p-4 text-center">Loading...</div>
  if (!items || items.length === 0) return <EmptyState type="favorites" />

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
            Favorites ({items.length})
          </span>
          <div className="flex gap-2">
            <Tooltip content="Open anki">
              <Button
                isIconOnly
                as={Link}
                color="secondary"
                href="/anki"
                isDisabled={items.length === 0}
                size="sm"
                variant="flat"
              >
                <span className="text-xs font-bold">Anki</span>
              </Button>
            </Tooltip>
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
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {items.map(({ word, language }) => (
            <HistoryOrFavoriteItemRow
              key={`${word}-${language}`}
              km_map={dictData.km_map}
              language={language}
              maybeColorMode={maybeColorMode}
              word={word}
              onDelete={handleDelete}
              onSelect={onSelect}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
})

FavoritesListOnly.displayName = 'FavoritesListOnly'
