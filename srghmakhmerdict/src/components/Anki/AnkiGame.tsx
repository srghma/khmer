import React, { useCallback, useMemo, useState, useSyncExternalStore, useEffect } from 'react'
import { Spinner } from '@heroui/spinner'
import { Grade } from 'femto-fsrs'
import { useAnkiSettings } from './useAnkiSettings'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import { GameModeAndData_NonEmptyArray_findItemByWord, useAnkiGameInitialData } from './useAnkiGameManagerInitialData'
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
import { AnkiPlayArea } from './AnkiPlayArea'
import { allFavorites_split_sorted } from './utils'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useLocation } from 'wouter'
import { useAnkiRoute } from './useAnkiRoute'

import { memoizeSync1_Boolean } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'

const LoadingSpinner = (
  <div className="flex h-full w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const NoFavoritesView = (
  <div className="flex h-full items-center justify-center">
    <p>No favorites found. Add some words to favorites to start learning.</p>
  </div>
)

const CardNotFoundView = (
  <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
    <span className="text-4xl">❓</span>
    <p>Card not found</p>
  </div>
)

const SelectCardToStartView = (
  <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
    <span className="text-4xl">🎴</span>
    <p>Select a card to start</p>
  </div>
)

const SessionFinishedView = React.memo(function SessionFinishedView({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-default-400 gap-4 p-8 text-center animate-in fade-in zoom-in duration-300">
      <span className="text-6xl">🎉</span>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Session Complete!</h2>
        <p className="mt-2 text-lg">You&apos;ve reviewed all due cards for now.</p>
      </div>
      <button
        className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
        onClick={onExit}
      >
        Back to Dashboard
      </button>
    </div>
  )
})

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
  language,
}: {
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>
  currentLanguage_favoriteItems: NonEmptyArray<FavoriteItem>
  language: DictionaryLanguage
}) {
  // Navigation Integration
  const { urlLanguage, selectedId, isSessionFinished } = useAnkiRoute()
  const [, setLocation] = useLocation()

  const routeLanguage = urlLanguage || 'en'

  const [currentLanguage_direction, currentLanguage_setDirection] = useAnkiCurrentDirection()
  const initialData = useAnkiGameInitialData(routeLanguage, currentLanguage_direction, currentLanguage_favoriteItems)

  const { km_map } = useDictionary()
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  // Local state only for 'Revealed' toggle
  const [isRevealed, setIsRevealed] = useState(false)

  // Reset revealed state when card changes
  useEffect(() => {
    setIsRevealed(false)
  }, [selectedId])

  // Memoize counts to prevent re-calculation on every render
  const counts = useCountOfSplitted(allFavorites_splitted)

  const handleDictChange = useCallback(
    (lang: DictionaryLanguage) => {
      // When changing language, we typically want to clear selection or at least start at the base for that language
      setLocation(`/${lang}`)
    },
    [setLocation],
  )

  const handleSelect = useCallback(
    (id: NonEmptyStringTrimmed) => {
      setLocation(`/${language}/${encodeURIComponent(id)}`)
    },
    [setLocation, language],
  )

  const handleClearSelection = useCallback(() => {
    setLocation(`/${language}`)
  }, [setLocation, language])

  const { reviewCard } = useFavorites()

  const handleRate = useCallback(
    async (wordToRate: NonEmptyStringTrimmed, rating: Grade) => {
      if (initialData === 'loading') return

      await reviewCard(wordToRate, language, rating)

      // Find next due item
      const nextDueItem = initialData.v.find(item => {
        const itemCard = 'card' in item ? item.card : item

        return itemCard.word !== wordToRate && itemCard.due <= now
      })

      if (nextDueItem) {
        const nextCard = 'card' in nextDueItem ? nextDueItem.card : nextDueItem
        const nextWord = nextCard.word

        setLocation(`/${language}/${encodeURIComponent(nextWord)}`)
      } else {
        setLocation(`/${language}/finished`)
      }
    },
    [initialData, reviewCard, now, setLocation, language],
  )

  const handleReveal = useCallback(() => {
    setIsRevealed(true)
  }, [])

  const handleExit = useCallback(() => {
    // Use ~/ to navigate to absolute path, breaking out of the nested /anki route
    setLocation(`~/${language}`)
  }, [setLocation, language])

  const sidebarClassName = useMemo(
    () => getSidebarClassName(!!selectedId || !!isSessionFinished),
    [selectedId, isSessionFinished],
  )
  const rightPanelClassName = useMemo(
    () => getRightPanelClassName(!!selectedId || !!isSessionFinished),
    [selectedId, isSessionFinished],
  )

  const itemData = useMemo(() => {
    if (!selectedId || initialData === 'loading') return undefined

    return GameModeAndData_NonEmptyArray_findItemByWord(selectedId, initialData)
  }, [selectedId, initialData])

  const rightPanelContent = useMemo(() => {
    if (isSessionFinished) return <SessionFinishedView onExit={handleExit} />

    if (selectedId) {
      if (!itemData) return CardNotFoundView

      return (
        <AnkiPlayArea
          isRevealed={isRevealed}
          itemData={itemData}
          km_map={km_map}
          onBack={handleClearSelection}
          onExit={handleExit}
          onRate={rating => handleRate(selectedId, rating)}
          onReveal={handleReveal}
        />
      )
    }

    return SelectCardToStartView
  }, [
    isSessionFinished,
    handleExit,
    selectedId,
    itemData,
    isRevealed,
    km_map,
    handleClearSelection,
    handleRate,
    handleReveal,
  ])

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
          onDictChange={handleDictChange}
          onDirectionChange={currentLanguage_setDirection}
          onExit={handleExit}
        />

        <div className="flex-1 flex overflow-hidden relative bg-background">
          {initialData === 'loading' ? (
            LoadingSpinner
          ) : (
            <AnkiListContent data={initialData} km_map={km_map} selectedId={selectedId} onSelect={handleSelect} />
          )}
        </div>
      </div>

      <div className={rightPanelClassName}>{rightPanelContent}</div>
    </div>
  )
})

export const AnkiGame = React.memo(function AnkiGame() {
  const { urlLanguage } = useAnkiRoute()
  const [, setLocation] = useLocation()

  const { language: settingsLanguage, setLanguage } = useAnkiSettings()
  const language = urlLanguage || settingsLanguage || 'en'

  // Sync AnkiSettings language with the URL language
  useEffect(() => {
    if (urlLanguage && urlLanguage !== settingsLanguage) {
      setLanguage(urlLanguage)
    }
  }, [urlLanguage, settingsLanguage, setLanguage])

  const { favorites: allFavorites, loading } = useFavorites()

  const allFavorites_splitted = useMemo(() => {
    if (!Array_isNonEmptyArray(allFavorites)) return undefined

    return allFavorites_split_sorted(allFavorites)
  }, [allFavorites])

  if (loading) return LoadingSpinner
  if (!allFavorites_splitted || !Array_isNonEmptyArray(allFavorites)) {
    return NoFavoritesView
  }

  const currentLanguage_favoriteItems = allFavorites_splitted[language]

  if (!currentLanguage_favoriteItems) {
    const nextLang = getBestAvailableLanguage(allFavorites_splitted)

    if (nextLang === language) {
      throw new Error('impossible: best language is current language, but current doesnt have items?')
    }

    // Use navigation to do a "hard" redirect to the best available language
    // This syncs the URL and prevents the "Card not found -> redirect back" loop
    setLocation(`/${nextLang}`)

    return LoadingSpinner
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <AnkiGameStep2
        allFavorites_splitted={allFavorites_splitted}
        currentLanguage_favoriteItems={currentLanguage_favoriteItems}
        language={language}
      />
    </div>
  )
})

AnkiGame.displayName = 'AnkiGame'
