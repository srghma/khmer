import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/react'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { useAppToast } from '../../providers/ToastProvider'

import * as FavDb from '../../db/favorite'
import { KhmerAnkiModal } from '../Anki'
import type { ReviewDirection } from '../Anki/AnkiModalContent'

import { LoadingState, EmptyState } from './SharedComponents'
import { HistoryItemRow } from './HistoryItemRow'
import { useListLogic } from './useListLogic'
import { ConfirmAction } from '../ConfirmAction'
import { favoritesStore } from '../../externalStores/historyAndFavorites'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const FavoritesListOnly: React.FC<ListPropsCommon> = React.memo(({ onSelect, km_map, maybeColorMode }) => {
  const toast = useAppToast()

  const { items, loading, handleDelete, handleClearAll } = useListLogic(
    FavDb.getFavorites,
    FavDb.removeFavorite,
    FavDb.deleteAllFavorites,
    'favorites',
    favoritesStore,
  )

  const [isAnkiOpen, setIsAnkiOpen] = useState(false)
  const [reviewDirection, setReviewDirection] = useState<ReviewDirection>('KM_TO_ALL')

  const handleOpenAnki = useCallback(
    (direction: ReviewDirection) => {
      if (!items) return

      // Logic check: ensure there are words for that direction?
      // For now, simple check for any favorites is likely enough,
      // or check specific language presence if strictly required.
      if (items.length === 0) {
        toast.error('No favorites to review' as NonEmptyStringTrimmed)

        return
      }

      setReviewDirection(direction)
      setIsAnkiOpen(true)
    },
    [items, toast],
  )

  const confirmContent = React.useMemo(
    () => <p className="text-small text-default-500">Are you sure you want to delete all {items?.length} items?</p>,
    [items?.length],
  )

  const khmerAnkiModalOnClose = useCallback(() => setIsAnkiOpen(false), [])

  if (loading) return <LoadingState />
  if (!items) return <EmptyState type="favorites" />

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
            Favorites ({items.length})
          </span>
          <div className="flex gap-2">
            <Tooltip content="Guess Khmer from English">
              <Button isIconOnly color="secondary" size="sm" variant="flat" onPress={() => handleOpenAnki('EN_TO_KM')}>
                <span className="text-xs font-bold">EN</span>
              </Button>
            </Tooltip>

            <Tooltip content="Guess Khmer from Russian">
              <Button isIconOnly color="secondary" size="sm" variant="flat" onPress={() => handleOpenAnki('RU_TO_KM')}>
                <span className="text-xs font-bold">RU</span>
              </Button>
            </Tooltip>

            <Tooltip content="Read Khmer, guess meaning">
              <Button isIconOnly color="secondary" size="sm" variant="flat" onPress={() => handleOpenAnki('KM_TO_ALL')}>
                <span className="text-xs font-bold">KM</span>
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
            <HistoryItemRow
              key={`${word}-${language}`}
              km_map={km_map}
              language={language}
              maybeColorMode={maybeColorMode}
              word={word}
              onDelete={handleDelete}
              onSelect={onSelect}
            />
          ))}
        </AnimatePresence>
      </div>

      {km_map && (
        <KhmerAnkiModal
          isOpen={isAnkiOpen}
          km_map={km_map}
          reviewDirection={reviewDirection}
          onClose={khmerAnkiModalOnClose}
        />
      )}
    </>
  )
})

FavoritesListOnly.displayName = 'FavoritesListOnly'
