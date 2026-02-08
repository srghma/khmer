import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt, FaGraduationCap } from 'react-icons/fa'
import { Button } from '@heroui/button'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { useAppToast } from '../../providers/ToastProvider'
import {
  strToContainsKhmerOrThrow,
  type TypedContainsKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import * as FavDb from '../../db/favourite'
import { KhmerAnkiModal } from '../Anki'
import {
  Set_toNonEmptySet_orUndefined,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { LoadingState, EmptyState } from './SharedComponents'
import { HistoryItemRow } from './HistoryItemRow'
import { useListLogic } from './useListLogic'
import {
  Map_entriesToArray,
  Map_entriesMapToArray_unlessUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { ConfirmAction } from '../ConfirmAction'
import { favoritesStore } from '../../externalStores/historyAndFavourites'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
}

export const FavouritesListOnly: React.FC<ListPropsCommon> = React.memo(({ onSelect, km_map, maybeColorMode }) => {
  const toast = useAppToast()

  const { items, loading, handleDelete, handleClearAll } = useListLogic(
    FavDb.getFavorites,
    FavDb.removeFavorite,
    FavDb.deleteAllFavourites,
    'favorites',
    favoritesStore,
  )

  const [isAnkiOpen, setIsAnkiOpen] = useState(false)
  const [ankiDeck, setAnkiDeck] = useState<NonEmptySet<TypedContainsKhmer> | undefined>()

  const handleOpenAnki = useCallback(() => {
    if (!km_map || !items) return

    // Optimized: Use FlatMap to filter and map in one pass without intermediate arrays
    const khmerWords = Map_entriesMapToArray_unlessUndefined(
      items,
      (word: NonEmptyStringTrimmed, lang: DictionaryLanguage) =>
        lang === 'km' && km_map.has(word) ? strToContainsKhmerOrThrow(word) : undefined,
    )

    const khmerSet = Set_toNonEmptySet_orUndefined(new Set(khmerWords))

    if (!khmerSet) {
      toast.error('No Khmer words in favorites to review' as NonEmptyStringTrimmed)

      return
    }
    setAnkiDeck(khmerSet)
    setIsAnkiOpen(true)
  }, [items, km_map, toast])

  if (loading) return <LoadingState />
  if (!items) return <EmptyState type="favorites" />

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-content1 overflow-x-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-default-50/90 backdrop-blur-md border-b border-divider shadow-sm">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">
            Favorites ({items.size})
          </span>
          <div className="flex gap-2">
            <Button
              color="secondary"
              size="sm"
              startContent={<FaGraduationCap />}
              variant="flat"
              onPress={handleOpenAnki}
            >
              Anki
            </Button>
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
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {Map_entriesToArray(items, (word, language) => (
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

      {km_map && ankiDeck && (
        <KhmerAnkiModal isOpen={isAnkiOpen} items={ankiDeck} km_map={km_map} onClose={() => setIsAnkiOpen(false)} />
      )}
    </>
  )
})

FavouritesListOnly.displayName = 'FavouritesListOnly'
