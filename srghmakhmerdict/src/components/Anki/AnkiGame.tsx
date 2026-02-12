import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { Spinner } from '@heroui/spinner'
import { Grade } from 'femto-fsrs'
import { useAnkiSettings } from './useAnkiSettings'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import {
  GameModeAndData_NonEmptyArray_findItemByWord,
  GameModeAndData_NonEmptyArray_first,
  GameModeAndDataItem_getCard,
  useAnkiGameInitialData,
  type GameModeAndDataItem,
} from './useAnkiGameManagerInitialData'
import { useFavorites } from '../../providers/FavoritesProvider'
import {
  Array_isNonEmptyArray,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { getBestAvailableLanguage } from '../../utils/getBestAvailableLanguage'
import type { FavoriteItem } from '../../db/favorite/item'
import type { DictionaryLanguage } from '../../types'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { AnkiHeader } from './AnkiHeader'
import { AnkiListContent } from './AnkiListContent'
import { AnkiPlayArea, type GameState } from './AnkiPlayArea'
import { allFavorites_split_sorted } from './utils'
import { useDictionary } from '../../providers/DictionaryProvider'
import { memoizeSync1_Boolean } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'

const LoadingSpinner = (
  <div className="flex h-full w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const getSidebarClassName = memoizeSync1_Boolean(
  (hasSelectedItem: boolean) =>
    `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] pt-[env(safe-area-inset-top)] ${hasSelectedItem ? 'hidden md:flex' : 'w-full'
    }`,
)

const getRightPanelClassName = memoizeSync1_Boolean(
  (hasSelectedItem: boolean) =>
    `flex-1 flex flex-col bg-background relative overflow-hidden transition-all ${!hasSelectedItem ? 'hidden md:flex' : 'flex'
    }`,
)

const useCountOfSplitted = (splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>) => {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  return useMemo(() => {
    const en = splitted['en']
    const ru = splitted['ru']
    const km = splitted['km']

    return {
      en_dueCount_today: en?.filter(f => f.due <= now).length ?? 0,
      en_dueCount_total: en?.length ?? 0,
      ru_dueCount_today: ru?.filter(f => f.due <= now).length ?? 0,
      ru_dueCount_total: ru?.length ?? 0,
      kh_dueCount_today: km?.filter(f => f.due <= now).length ?? 0,
      kh_dueCount_total: km?.length ?? 0,
    }
  }, [splitted, now])
}

const AnkiGameStep2 = React.memo(function AnkiGameStep2({
  allFavorites_splitted,
  currentLanguage_favoriteItems,
  onExit,
}: {
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>
  currentLanguage_favoriteItems: NonEmptyArray<FavoriteItem>
  onExit: () => void
}) {
  const { language, setLanguage } = useAnkiSettings()
  const [currentLanguage_direction, currentLanguage_setDirection] = useAnkiCurrentDirection()
  const initialData = useAnkiGameInitialData(language, currentLanguage_direction, currentLanguage_favoriteItems)

  const { km_map } = useDictionary()

  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  const [gameState, setGameState] = useState<GameState>({
    selectedId: undefined,
    isRevealed: false,
  })

  // Memoize counts to prevent re-calculation on every render
  const counts = useCountOfSplitted(allFavorites_splitted)

  const handleSelect = useCallback((id: NonEmptyStringTrimmed) => {
    setGameState({ selectedId: id, isRevealed: false })
  }, [])

  const handleClearSelection = useCallback(() => {
    // TODO: should not unselect but only on mobile view should go back to list
    setGameState(prev => ({ ...prev, selectedId: undefined }))
  }, [])

  const selectedItemData: GameModeAndDataItem | undefined = useMemo(() => {
    if (initialData === 'loading') return undefined
    if (!gameState.selectedId) {
      return GameModeAndData_NonEmptyArray_first(initialData)
    }

    return GameModeAndData_NonEmptyArray_findItemByWord(gameState.selectedId, initialData)
  }, [initialData, gameState.selectedId])

  const { reviewCard } = useFavorites()

  const handleRate = useCallback(
    async (rating: Grade) => {
      if (!selectedItemData || initialData === 'loading') return

      const card = GameModeAndDataItem_getCard(selectedItemData)

      await reviewCard(card.word, card.language, rating)

      // Find next due item
      const nextDueItem = initialData.v.find(item => {
        const itemCard = 'card' in item ? item.card : item

        return itemCard.word !== card.word && itemCard.due <= now
      })

      if (nextDueItem) {
        const nextCard = 'card' in nextDueItem ? nextDueItem.card : nextDueItem
        const nextWord = nextCard.word

        setGameState({ selectedId: nextWord, isRevealed: false })
      } else {
        setGameState({ selectedId: undefined, isRevealed: false })
      }
    },
    [selectedItemData, initialData, reviewCard, now],
  )

  const handleReveal = useCallback(() => {
    setGameState(prev => ({ ...prev, isRevealed: true }))
  }, [])

  const sidebarClassName = getSidebarClassName(!!gameState.selectedId)
  const rightPanelClassName = getRightPanelClassName(!!gameState.selectedId)

  return (
    <div className="flex h-full w-full md:h-full bg-background overflow-hidden font-inter text-foreground h-[100dvh]">
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
          onExit={onExit}
        />

        <div className="flex-1 flex overflow-hidden relative bg-background">
          {initialData === 'loading' || !selectedItemData ? (
            LoadingSpinner
          ) : (
            <AnkiListContent
              data={initialData}
              km_map={km_map}
              selectedId={GameModeAndDataItem_getCard(selectedItemData).word}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      <div className={rightPanelClassName}>
        {selectedItemData && initialData !== 'loading' ? (
          <AnkiPlayArea
            isRevealed={gameState.isRevealed}
            itemData={selectedItemData}
            km_map={km_map}
            onBack={handleClearSelection}
            onExit={onExit}
            onRate={handleRate}
            onReveal={handleReveal}
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

const noFavorites = (
  <div className="flex h-full items-center justify-center">
    <p>No favorites found. Add some words to favorites to start learning.</p>
  </div>
)

export const AnkiGame = React.memo(({ onExit }: { onExit: () => void }) => {
  const { language, setLanguage } = useAnkiSettings()

  const { favorites: allFavorites, loading } = useFavorites()

  const allFavorites_splitted = useMemo(() => {
    if (!Array_isNonEmptyArray(allFavorites)) return undefined

    return allFavorites_split_sorted(allFavorites)
  }, [allFavorites])

  if (loading) return LoadingSpinner

  if (!allFavorites_splitted || !Array_isNonEmptyArray(allFavorites)) {
    return noFavorites
  }

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
    <div className="fixed inset-0 z-[100] bg-background">
      <AnkiGameStep2
        key={language}
        allFavorites_splitted={allFavorites_splitted}
        currentLanguage_favoriteItems={currentLanguage_favoriteItems}
        onExit={onExit}
      />
    </div>
  )
})

AnkiGame.displayName = 'AnkiGame'
