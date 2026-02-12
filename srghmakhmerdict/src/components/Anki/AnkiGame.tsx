import React, { useCallback, useMemo, useState, useSyncExternalStore, useEffect } from 'react'
import { Spinner } from '@heroui/spinner'
import { useAnkiSettings } from './useAnkiSettings'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { allFavorites_split_sorted } from './utils'
import {
  Array_isNonEmptyArray,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { getBestAvailableLanguage } from '../../utils/getBestAvailableLanguage'
import { getKmWords, type KhmerWordsMap } from '../../db/dict'
import type { FavoriteItem } from '../../db/favorite/item'
import type { DictionaryLanguage } from '../../types'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import { AnkiHeader } from './AnkiHeader'
import { AnkiListContent } from './AnkiListContent'
import { AnkiPlayArea, type GameState } from './AnkiPlayArea'

const LoadingSpinner = (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const useCountOfSplitted = (splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>) => {
  return useMemo(() => {
    const en = splitted['en']
    const ru = splitted['ru']
    const km = splitted['km']
    const now = Date.now()

    return {
      en_dueCount_today: en?.filter(f => f.due <= now).length ?? 0,
      en_dueCount_total: en?.length ?? 0,
      ru_dueCount_today: ru?.filter(f => f.due <= now).length ?? 0,
      ru_dueCount_total: ru?.length ?? 0,
      kh_dueCount_today: km?.filter(f => f.due <= now).length ?? 0,
      kh_dueCount_total: km?.length ?? 0,
    }
  }, [splitted])
}

const AnkiGameStep2 = React.memo(function AnkiGameStep2({
  allFavorites_splitted,
  currentLanguage_favoriteItems,
}: {
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>
  currentLanguage_favoriteItems: NonEmptyArray<FavoriteItem>
}) {
  const { language, setLanguage } = useAnkiSettings()
  const [currentLanguage_direction, currentLanguage_setDirection] = useAnkiCurrentDirection()

  // -- Load Khmer Map --
  const [km_map, setKmMap] = useState<KhmerWordsMap | null>(null)

  useEffect(() => {
    getKmWords().then(setKmMap).catch(console.error)
  }, [])

  const [gameState, setGameState] = useState<GameState>({
    selectedId: null,
    isRevealed: false,
  })

  // Memoize counts to prevent re-calculation on every render
  const counts = useCountOfSplitted(allFavorites_splitted)

  const handleSelect = useCallback((id: string) => {
    setGameState({ selectedId: id, isRevealed: false })
  }, [])

  const handleClearSelection = useCallback(() => {
    setGameState(prev => ({ ...prev, selectedId: null }))
  }, [])

  const { selectedId } = gameState

  const selectedItem = useMemo(
    () => (selectedId ? currentLanguage_favoriteItems.find(i => i.word === selectedId) : undefined),
    [currentLanguage_favoriteItems, selectedId],
  )

  const sidebarClassName = useMemo(
    () =>
      `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] pt-[env(safe-area-inset-top)] ${
        selectedItem ? 'hidden md:flex' : 'w-full'
      }`,
    [!!selectedItem],
  )

  const rightPanelClassName = useMemo(
    () =>
      `flex-1 flex flex-col bg-content1 relative overflow-hidden transition-all ${
        !selectedItem ? 'hidden md:flex' : 'flex'
      }`,
    [!!selectedItem],
  )

  if (!km_map) return LoadingSpinner

  return (
    <div className="flex h-full w-full bg-content1 overflow-hidden font-inter text-foreground">
      <div className={sidebarClassName}>
        <AnkiHeader
          activeDict={language}
          direction={currentLanguage_direction}
          en_dueCount_today={counts.en_dueCount_today}
          en_dueCount_total={counts.en_dueCount_total}
          kh_dueCount_today={counts.kh_dueCount_today}
          kh_dueCount_total={counts.kh_dueCount_total}
          ru_dueCount_today={counts.ru_dueCount_today}
          ru_dueCount_total={counts.ru_dueCount_total}
          onDictChange={setLanguage}
          onDirectionChange={currentLanguage_setDirection}
        />

        <div className="flex-1 flex overflow-hidden relative bg-content1">
          {currentLanguage_favoriteItems ? (
            <AnkiListContent
              direction={currentLanguage_direction}
              items={currentLanguage_favoriteItems}
              km_map={km_map}
              language={language}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-default-400 p-4 text-center">
              <span>No cards for {language.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className={rightPanelClassName}>
        {selectedItem ? (
          <AnkiPlayArea
            isRevealed={gameState.isRevealed}
            item={selectedItem}
            km_map={km_map}
            language={language}
            setGameState={setGameState}
            onBack={handleClearSelection}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
            <span className="text-4xl">🎴</span>
            <p>Select a card to start</p>
          </div>
        )}
      </div>
    </div>
  )
})

export const AnkiGame = React.memo(() => {
  const { language, setLanguage } = useAnkiSettings()

  const allFavorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)

  if (!Array_isNonEmptyArray(allFavorites)) {
    throw new Error('impossible: empty array')
  }

  const allFavorites_splitted = useMemo(() => allFavorites_split_sorted(allFavorites), [allFavorites])

  const currentLanguage_favoriteItems: NonEmptyArray<FavoriteItem> | undefined = allFavorites_splitted[language]

  if (!currentLanguage_favoriteItems) {
    const nextLang = getBestAvailableLanguage(allFavorites_splitted)

    if (nextLang === language) {
      throw new Error('impossible: best language is current language, but current doesnt have items?')
    }

    setLanguage(nextLang)

    return LoadingSpinner
  }

  return (
    <AnkiGameStep2
      allFavorites_splitted={allFavorites_splitted}
      currentLanguage_favoriteItems={currentLanguage_favoriteItems}
    />
  )
})

AnkiGame.displayName = 'AnkiGame'
