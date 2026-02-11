import React, { useMemo, useSyncExternalStore } from 'react'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useAnkiSettings } from './useAnkiSettings'
import { AnkiGameSession_GuessingKhmer } from './AnkiGameSession_GuessingKhmer'
import { AnkiGameSession_GuessingNonKhmer } from './AnkiGameSession_GuessingNonKhmer'
import { AnkiHeader } from './AnkiHeader'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { Spinner } from '@heroui/spinner'
import type { AnkiDirection } from './types'
import { allFavorites_filterByLanguage } from './utils'
import type { DictionaryLanguage } from '../../types'
import type { FavoriteItem } from '../../db/favorite/item'
import type { KhmerWordsMap } from '../../db/dict'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

// --- Sub-Component for Routing ---

interface AnkiGameRouterProps {
  language: DictionaryLanguage
  km_map: KhmerWordsMap
  direction: AnkiDirection
  allFavorites: NonEmptyArray<FavoriteItem>
  favoritesOfLanguage: NonEmptyArray<FavoriteItem> | undefined
}

const AnkiGameRouter = React.memo(
  ({ language, km_map, direction, allFavorites, favoritesOfLanguage }: AnkiGameRouterProps) => {
    if (!favoritesOfLanguage || favoritesOfLanguage.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-default-400 bg-content1">
          <p className="mb-2 text-xl font-bold">🎉 All Caught Up!</p>
          <p>No cards found for {language.toUpperCase()}.</p>
        </div>
      )
    }

    // Routing Logic
    const shouldUseGuessingKhmer = direction === 'GUESSING_KHMER' || language === 'en' || language === 'ru'

    if (shouldUseGuessingKhmer) {
      return (
        <AnkiGameSession_GuessingKhmer
          allFavorites={allFavorites}
          direction={direction}
          km_map={km_map}
          language={language}
        />
      )
    }

    return (
      <AnkiGameSession_GuessingNonKhmer
        allFavorites={allFavorites}
        direction={direction}
        km_map={km_map}
        language={language}
      />
    )
  },
)

AnkiGameRouter.displayName = 'AnkiGameRouter'

// --- Main Component ---

export const AnkiGame = React.memo(() => {
  const {
    language,
    setLanguage,
    direction_en,
    setDirection_en,
    direction_ru,
    setDirection_ru,
    direction_km,
    setDirection_km,
  } = useAnkiSettings()

  const { km_map } = useDictionary()
  const allFavorites = Array_toNonEmptyArray_orThrow(
    useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot),
  )

  // Derived Settings
  const currentDirection = useMemo(
    () => (language === 'en' ? direction_en : language === 'ru' ? direction_ru : direction_km),
    [language, direction_en, direction_ru, direction_km],
  )

  const setDirection = (d: AnkiDirection) => {
    if (language === 'en') setDirection_en(d)
    else if (language === 'ru') setDirection_ru(d)
    else setDirection_km(d)
  }

  const favoritesOfEn = useMemo(
    () => (allFavorites ? allFavorites_filterByLanguage(allFavorites, 'en') : undefined),
    [allFavorites],
  )

  const favoritesOfRu = useMemo(
    () => (allFavorites ? allFavorites_filterByLanguage(allFavorites, 'ru') : undefined),
    [allFavorites],
  )

  const favoritesOfKh = useMemo(
    () => (allFavorites ? allFavorites_filterByLanguage(allFavorites, 'km') : undefined),
    [allFavorites],
  )

  const isEnTabDisabled = useMemo(() => !favoritesOfEn || favoritesOfEn.length === 0, [favoritesOfEn])
  const isRuTabDisabled = useMemo(() => !favoritesOfRu || favoritesOfRu.length === 0, [favoritesOfRu])
  const isKhTabDisabled = useMemo(() => !favoritesOfKh || favoritesOfKh.length === 0, [favoritesOfKh])

  // Derived Data
  const favoritesOfCurrentLanguage = useMemo(
    () => (language === 'en' ? favoritesOfEn : language === 'ru' ? favoritesOfRu : favoritesOfKh),
    [language, favoritesOfEn, favoritesOfRu, favoritesOfKh],
  )

  const count = useMemo(
    () => (favoritesOfCurrentLanguage ? favoritesOfCurrentLanguage.filter(f => f.due <= Date.now()).length : 0),
    [favoritesOfCurrentLanguage],
  )

  // Early return for loading state
  if (!allFavorites || !favoritesOfCurrentLanguage) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <AnkiHeader
        activeDict={language}
        count={count}
        direction={currentDirection}
        isEnTabDisabled={isEnTabDisabled}
        isKhTabDisabled={isKhTabDisabled}
        isRuTabDisabled={isRuTabDisabled}
        onDictChange={setLanguage}
        onDirectionChange={setDirection}
      />

      <div className="flex-1 relative overflow-hidden">
        <AnkiGameRouter
          allFavorites={allFavorites}
          direction={currentDirection}
          favoritesOfLanguage={favoritesOfCurrentLanguage}
          km_map={km_map}
          language={language}
        />
      </div>
    </div>
  )
})

AnkiGame.displayName = 'AnkiGame'
