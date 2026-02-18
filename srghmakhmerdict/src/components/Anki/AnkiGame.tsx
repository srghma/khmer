import React, { useCallback, useMemo, useSyncExternalStore, useEffect } from 'react'
import { Spinner } from '@heroui/spinner'
import { Grade } from 'femto-fsrs'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import { GameModeAndData_NonEmptyArray_findItemByWord, useAnkiGameInitialData } from './useAnkiGameManagerInitialData'
import { useFavorites } from '../../providers/FavoritesProvider'
import {
  Array_isNonEmptyArray,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { getBestAvailableLanguage } from '../../utils/getBestAvailableLanguage'
import type { DictionaryLanguage } from '../../types'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { AnkiHeader } from './AnkiHeader'
import { AnkiListContent } from './AnkiListContent'
import { AnkiPlayArea } from './AnkiPlayArea'
import { allFavorites_split_sorted } from './utils'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useAnkiNavigation } from './useAnkiNavigation'
import { AnkiImport } from './Import'
import { AnkiExport } from './Export'
import { useAnkiRoute } from './useAnkiRoute'

import { memoizeSync1_Boolean } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import type { FavoriteItem } from '../../db/favorite/item'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

import { useAppToast } from '../../providers/ToastProvider'

import { useI18nContext } from '../../i18n/i18n-react-custom'

const LoadingSpinner = (
  <div className="flex h-full w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const getSidebarClassName = memoizeSync1_Boolean((hasSelectedItem: boolean) => {
  return `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] md:max-w-[40vw] pt-[env(safe-area-inset-top)] ${hasSelectedItem ? 'hidden md:flex' : 'w-full'
    }`
})

const getRightPanelClassName = memoizeSync1_Boolean((hasSelectedItem: boolean) => {
  return `flex-1 flex flex-col bg-background relative overflow-hidden transition-all ${!hasSelectedItem ? 'hidden md:flex' : 'flex'
    } w-full md:w-auto`
})

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

interface AnkiGameStep2Props {
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>
}

const AnkiGameStep2 = React.memo(function AnkiGameStep2({ allFavorites_splitted }: AnkiGameStep2Props) {
  // useAnkiAutoRedirect(allFavorites_splitted)

  const { LL } = useI18nContext()
  const { subPage } = useAnkiRoute()
  const { urlLanguage, selectedId, navigateToWord, navigateToLanguage, exitAnki } = useAnkiNavigation()

  const currentLanguage_favoriteItems = assertIsDefinedAndReturn(allFavorites_splitted[urlLanguage])

  const [currentLanguage_direction, currentLanguage_setDirection] = useAnkiCurrentDirection()

  const initialData = useAnkiGameInitialData(urlLanguage, currentLanguage_direction, currentLanguage_favoriteItems)

  const { km_map } = useDictionary()
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  // Memoize counts to prevent re-calculation on every render
  const counts = useCountOfSplitted(allFavorites_splitted)

  const { reviewCard } = useFavorites()

  const toast = useAppToast()

  const handleRate = useCallback(
    async (wordToRate: NonEmptyStringTrimmed, rating: Grade) => {
      if (initialData === 'loading') return

      await reviewCard(wordToRate, urlLanguage, rating)

      // Find next due item
      const nextDueItem = initialData.v.find(item => {
        const itemCard = 'card' in item ? item.card : item

        return itemCard.word !== wordToRate && itemCard.due <= now
      })

      if (nextDueItem) {
        const nextCard = 'card' in nextDueItem ? nextDueItem.card : nextDueItem
        const nextWord = nextCard.word

        navigateToWord(nextWord)
      } else {
        toast.success(LL.ANKI.SESSION_FINISHED())
        navigateToLanguage(urlLanguage)
      }
    },
    [initialData, reviewCard, now, navigateToWord, navigateToLanguage, urlLanguage, toast, LL],
  )

  const sidebarClassName = useMemo(() => getSidebarClassName(!!selectedId || !!subPage), [selectedId, subPage])
  const rightPanelClassName = useMemo(() => getRightPanelClassName(!!selectedId || !!subPage), [selectedId, subPage])

  const itemData = useMemo(() => {
    if (!selectedId || initialData === 'loading') return undefined

    return GameModeAndData_NonEmptyArray_findItemByWord(selectedId, initialData)
  }, [selectedId, initialData])

  const rightPanelContent = useMemo(() => {
    if (subPage === 'import') return <AnkiImport />
    if (subPage === 'export') return <AnkiExport />

    if (selectedId) {
      if (!itemData) {
        return (
          <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
            <span className="text-4xl">❓</span>
            <p>{LL.ANKI.CARD_NOT_FOUND()}</p>
          </div>
        )
      }

      return <AnkiPlayArea key={selectedId} itemData={itemData} onRate={rating => handleRate(selectedId, rating)} />
    }

    return (
      <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
        <span className="text-4xl">🎴</span>
        <p>{LL.ANKI.SELECT_CARD()}</p>
      </div>
    )
  }, [exitAnki, selectedId, itemData, km_map, handleRate, LL, subPage])

  return (
    <div className="flex h-full w-full md:h-full bg-background overflow-hidden font-inter text-foreground h-[100dvh]">
      <div className={`${sidebarClassName} text-base`}>
        <AnkiHeader
          activeDict={urlLanguage}
          direction={currentLanguage_direction}
          en_dueCount_today={counts.en_dueCount_today}
          en_dueCount_total={counts.en_dueCount_total}
          kh_dueCount_today={counts.kh_dueCount_today}
          kh_dueCount_total={counts.kh_dueCount_total}
          ru_dueCount_today={counts.ru_dueCount_today}
          ru_dueCount_total={counts.ru_dueCount_total}
          onDirectionChange={currentLanguage_setDirection}
          onExit={exitAnki}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
          {initialData === 'loading' ? LoadingSpinner : <AnkiListContent data={initialData} selectedId={selectedId} />}
        </div>
      </div>

      <div className={`${rightPanelClassName} scaling-details`}>{rightPanelContent}</div>
    </div>
  )
})

const AnkiGameInner = React.memo(function AnkiGameInner(props: AnkiGameStep2Props) {
  const { allFavorites_splitted } = props
  const { urlLanguage, navigateToLanguage } = useAnkiNavigation()

  const currentLanguage_favoriteItems = allFavorites_splitted[urlLanguage]
  const { subPage } = useAnkiRoute()

  useEffect(() => {
    if (!currentLanguage_favoriteItems && !subPage) {
      const nextLang = getBestAvailableLanguage(allFavorites_splitted)

      if (nextLang !== urlLanguage) {
        navigateToLanguage(nextLang)
      }
    }
  }, [currentLanguage_favoriteItems, allFavorites_splitted, urlLanguage, navigateToLanguage, subPage])

  if (!currentLanguage_favoriteItems && !subPage) {
    return LoadingSpinner
  }

  return <AnkiGameStep2 {...props} />
})

export const AnkiGame = React.memo(function AnkiGame() {
  const { favorites: allFavorites, loading } = useFavorites()

  const allFavorites_splitted = useMemo(() => {
    if (!Array_isNonEmptyArray(allFavorites)) return undefined

    return allFavorites_split_sorted(allFavorites)
  }, [allFavorites])

  const { LL } = useI18nContext()

  if (loading) return LoadingSpinner
  if (!allFavorites_splitted || !Array_isNonEmptyArray(allFavorites)) {
    const { subPage } = useAnkiRoute()

    if (subPage === 'import') {
      return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <AnkiHeader
            activeDict="en" // dummy
            direction="GUESSING_NON_KHMER" // dummy
            en_dueCount_today={0}
            en_dueCount_total={0}
            kh_dueCount_today={0}
            kh_dueCount_total={0}
            ru_dueCount_today={0}
            ru_dueCount_total={0}
            onDirectionChange={() => { }}
            onExit={() => { window.location.hash = '' }} // or some other way to exit
          />
          <AnkiImport />
        </div>
      )
    }

    return (
      <div className="flex h-full items-center justify-center">
        <p>{LL.ANKI.NO_FAVORITES()}</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <AnkiGameInner allFavorites_splitted={allFavorites_splitted} />
    </div>
  )
})

AnkiGame.displayName = 'AnkiGame'
