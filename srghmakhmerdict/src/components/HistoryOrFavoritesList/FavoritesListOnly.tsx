import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaRegTrashAlt } from 'react-icons/fa'
import { Button } from '@heroui/button'
import { Modal, ModalContent, Tooltip } from '@heroui/react'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import * as FavDb from '../../db/favorite'

import { LoadingState, EmptyState } from './SharedComponents'
import { HistoryItemRow } from './HistoryItemRow'
import { useListLogic } from './useListLogic'
import { ConfirmAction } from '../ConfirmAction'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { useDictionary } from '../../providers/DictionaryProvider'
import { AnkiPulseProvider } from '../Anki/AnkiPulseContext'
import { AnkiSettingsProvider } from '../Anki/useAnkiSettings'
import { AnkiGame } from '../Anki/AnkiGame'

interface ListPropsCommon {
  onSelect: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  maybeColorMode: MaybeColorizationMode
}

const ankiModalClassNames = {
  // body: 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
  header: 'mt-[env(safe-area-inset-top)]',
  closeButton: 'mt-[env(safe-area-inset-top)]',
}

export const FavoritesListOnly: React.FC<ListPropsCommon> = React.memo(({ onSelect, maybeColorMode }) => {
  const dictData = useDictionary()

  const { items, loading, handleDelete, handleClearAll } = useListLogic(
    FavDb.getFavorites,
    FavDb.removeFavorite,
    FavDb.deleteAllFavorites,
    'favorites',
    favoritesStore,
  )

  const [isAnkiOpen, setIsAnkiOpen] = useState(false)
  const handleOpenAnki = useCallback(() => setIsAnkiOpen(true), [])

  const confirmContent = React.useMemo(
    () => <p className="text-small text-default-500">Are you sure you want to delete all {items?.length} items?</p>,
    [items?.length],
  )

  const handleCloseAnki = useCallback(() => setIsAnkiOpen(false), [])

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
            <Tooltip content="Open anki">
              <Button
                isIconOnly
                color="secondary"
                isDisabled={items.length === 0}
                size="sm"
                variant="flat"
                onPress={handleOpenAnki}
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
            <HistoryItemRow
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

      <AnkiPulseProvider>
        <AnkiSettingsProvider>
          <Modal
            classNames={ankiModalClassNames}
            isOpen={isAnkiOpen}
            scrollBehavior="inside"
            size="full"
            onClose={handleCloseAnki}
          >
            <ModalContent>
              <AnkiGame />
            </ModalContent>
          </Modal>
        </AnkiSettingsProvider>
      </AnkiPulseProvider>
    </>
  )
})

FavoritesListOnly.displayName = 'FavoritesListOnly'
