import React, { useCallback, useMemo, useSyncExternalStore, useEffect, memo } from 'react'
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
import { useAnkiNavigation } from './useAnkiNavigation'
import { useAnkiRoute } from './useAnkiRoute'
import { AnkiImport } from './Import'
import { AnkiExport } from './Export'
import { AnkiSettingsMenu } from './AnkiSettings'
import { AnkiGeneralSettings } from './AnkiGeneralSettings'

import { memoizeSync1_Boolean } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/memoize'
import type { FavoriteItem } from '../../db/favorite/item'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'

import { useAppToast } from '../../providers/ToastProvider'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import type { AnkiDirection } from './types'
import { DetailViewBackButton } from '../DetailView/DetailViewHeader'
import { Card, CardBody, CardHeader } from '@heroui/react'

// --- 1. Helper Styles & Components ---

const LoadingSpinner = (
  <div className="flex h-full w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const getSidebarClassName = memoizeSync1_Boolean((isRightPanelVisible: boolean) => {
  return [
    'flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] md:max-w-[40vw] pt-[env(safe-area-inset-top)]',
    isRightPanelVisible ? 'hidden md:flex' : 'w-full',
  ].join(' ')
})

const getRightPanelClassName = memoizeSync1_Boolean((isRightPanelVisible: boolean) => {
  return [
    'flex-1 flex flex-col bg-background relative overflow-hidden transition-all w-full md:w-auto',
    !isRightPanelVisible ? 'hidden md:flex' : 'flex',
  ].join(' ')
})

// --- 2. Hooks ---

const useCountOfSplitted = (
  splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined> | undefined,
) => {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  return useMemo(() => {
    // Safe handling if splitted is undefined (empty state)
    const en = splitted?.['en']
    const ru = splitted?.['ru']
    const km = splitted?.['km']

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

// --- 3. Layout Component (Pure UI) ---

interface AnkiGameLayoutProps {
  counts: ReturnType<typeof useCountOfSplitted>
  urlLanguage: DictionaryLanguage
  direction: AnkiDirection
  onDirectionChange: (v: AnkiDirection) => void
  onExit: () => void
  leftSidebarContent: React.ReactNode
  rightPanelContent: React.ReactNode
  isRightPanelVisibleOnMobile: boolean
  headerPage: DictionaryLanguage | 'settings'
}

const AnkiGameLayout = React.memo<AnkiGameLayoutProps>(
  ({
    counts,
    urlLanguage,
    direction,
    onDirectionChange,
    onExit,
    leftSidebarContent,
    rightPanelContent,
    isRightPanelVisibleOnMobile,
    headerPage,
  }) => {
    const sidebarClassName = useMemo(
      () => getSidebarClassName(isRightPanelVisibleOnMobile),
      [isRightPanelVisibleOnMobile],
    )
    const rightPanelClassName = useMemo(
      () => getRightPanelClassName(isRightPanelVisibleOnMobile),
      [isRightPanelVisibleOnMobile],
    )

    return (
      <div className="flex w-full bg-background overflow-hidden font-inter text-foreground h-[100dvh]">
        <div className={`${sidebarClassName} text-base h-[100dvh]`}>
          <AnkiHeader
            activeDict={urlLanguage}
            currentPage={headerPage}
            direction={direction}
            en_dueCount_today={counts.en_dueCount_today}
            en_dueCount_total={counts.en_dueCount_total}
            kh_dueCount_today={counts.kh_dueCount_today}
            kh_dueCount_total={counts.kh_dueCount_total}
            ru_dueCount_today={counts.ru_dueCount_today}
            ru_dueCount_total={counts.ru_dueCount_total}
            onDirectionChange={onDirectionChange}
            onExit={onExit}
          />

          <div className="flex-1 flex flex-col overflow-hidden relative bg-background">{leftSidebarContent}</div>
        </div>

        <div className={`${rightPanelClassName}`}>{rightPanelContent}</div>
      </div>
    )
  },
)

AnkiGameLayout.displayName = 'AnkiGameLayout'

// --- 4. Active Game Session (The "Guard" Target) ---
// This component is ONLY rendered when we have guaranteed favorites.
// It safely calls useAnkiGameInitialData.

interface AnkiGameActiveSessionProps {
  favorites: NonEmptyArray<FavoriteItem>
  urlLanguage: DictionaryLanguage
  direction: AnkiDirection
  setDirection: (v: AnkiDirection) => void
  counts: ReturnType<typeof useCountOfSplitted>
  onExit: () => void
}

const AnkiGameActiveSession = React.memo<AnkiGameActiveSessionProps>(
  ({ favorites, urlLanguage, direction, setDirection, counts, onExit }) => {
    const { LL } = useI18nContext()
    const { selectedId, navigateToWord, navigateToLanguage } = useAnkiNavigation()
    const toast = useAppToast()
    const { reviewCard } = useFavorites()
    const pulseStore = useAnkiPulseStore()
    const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

    // Call Hook safely because `favorites` is strictly NonEmptyArray here
    const gameInitialData = useAnkiGameInitialData(urlLanguage, direction, favorites)

    const handleRate = useCallback(
      async (wordToRate: NonEmptyStringTrimmed, rating: Grade) => {
        if (gameInitialData === 'loading' || !gameInitialData) return

        await reviewCard(wordToRate, urlLanguage, rating)

        const nextDueItem = gameInitialData.v.find(item => {
          const itemCard = 'card' in item ? item.card : item

          return itemCard.word !== wordToRate && itemCard.due <= now
        })

        if (nextDueItem) {
          const nextCard = 'card' in nextDueItem ? nextDueItem.card : nextDueItem

          navigateToWord(nextCard.word)
        } else {
          toast.success(LL.ANKI.SESSION_FINISHED())
          navigateToLanguage(urlLanguage)
        }
      },
      [gameInitialData, reviewCard, now, navigateToWord, navigateToLanguage, urlLanguage, toast, LL],
    )

    // Layout Content
    const leftSidebarContent = useMemo(() => {
      if (gameInitialData === 'loading') return LoadingSpinner

      return <AnkiListContent data={gameInitialData} selectedId={selectedId} />
    }, [gameInitialData, selectedId])

    const itemData = useMemo(() => {
      if (!selectedId || gameInitialData === 'loading') return undefined

      return GameModeAndData_NonEmptyArray_findItemByWord(selectedId, gameInitialData)
    }, [selectedId, gameInitialData])

    const rightPanelContent = useMemo(() => {
      if (selectedId) {
        if (!itemData) {
          return (
            <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
              <span className="text-4xl">❓</span>
              <p>{LL.ANKI.CARD_NOT_FOUND()}</p>
            </div>
          )
        }

        return <AnkiPlayArea key={selectedId} itemData={itemData} onRate={r => handleRate(selectedId, r)} />
      }

      return (
        <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
          <span className="text-4xl">🎴</span>
          <p>{LL.ANKI.SELECT_CARD()}</p>
        </div>
      )
    }, [selectedId, itemData, handleRate, LL])

    const isRightPanelVisibleOnMobile = !!selectedId

    return (
      <AnkiGameLayout
        counts={counts}
        direction={direction}
        headerPage={urlLanguage}
        isRightPanelVisibleOnMobile={isRightPanelVisibleOnMobile}
        leftSidebarContent={leftSidebarContent}
        rightPanelContent={rightPanelContent}
        urlLanguage={urlLanguage}
        onDirectionChange={setDirection}
        onExit={onExit}
      />
    )
  },
)

AnkiGameActiveSession.displayName = 'AnkiGameActiveSession'

//////////////

const AnkiSettingsItemWrapper = memo(function AnkiSettingsItemWrapper({
  children,
  header,
  backButton_goBack,
}: {
  children: React.ReactNode
  header: React.ReactNode
  backButton_goBack: () => void
}) {
  return (
    <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
      <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
        {<DetailViewBackButton onPress={backButton_goBack} />}

        {/* Central Text */}
        {header}
      </CardHeader>

      <CardBody>{children}</CardBody>
    </Card>
  )
})

AnkiSettingsItemWrapper.displayName = 'AnkiSettingsItemWrapper'

// --- 5. Controller (Orchestrator) ---
// Handles Routing, Settings Mode, and Empty States.

interface AnkiGameControllerProps {
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined> | undefined
}

const AnkiGameController = React.memo(function AnkiGameController({ allFavorites_splitted }: AnkiGameControllerProps) {
  const { LL } = useI18nContext()
  const route = useAnkiRoute()
  const { urlLanguage, navigateToLanguage, exitAnki, navigateToSettings } = useAnkiNavigation()

  const counts = useCountOfSplitted(allFavorites_splitted)
  const [direction, setDirection] = useAnkiCurrentDirection()

  const isSettingsPage = route.t === 'settings'
  const currentLanguage_favoriteItems = allFavorites_splitted?.[urlLanguage]

  // Redirect if current language is empty but others exist (and not in settings)
  useEffect(() => {
    if (!currentLanguage_favoriteItems && !isSettingsPage && allFavorites_splitted) {
      const nextLang = getBestAvailableLanguage(allFavorites_splitted)

      if (nextLang !== urlLanguage) {
        navigateToLanguage(nextLang)
      }
    }
  }, [currentLanguage_favoriteItems, allFavorites_splitted, urlLanguage, navigateToLanguage, isSettingsPage])

  // --- BRANCH 1: Settings Mode ---
  if (isSettingsPage) {
    const leftSidebarContent = <AnkiSettingsMenu />

    let rightPanelContent: React.ReactNode

    switch (route.subPage) {
      case 'import':
        rightPanelContent = (
          <AnkiSettingsItemWrapper
            backButton_goBack={navigateToSettings}
            header={
              <>
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {LL.ANKI.IMPORT.TITLE()}
                </h2>
                <p className="text-default-500 text-sm mt-1">{LL.ANKI.IMPORT.DESCRIPTION()}</p>
              </>
            }
          >
            <AnkiImport />
          </AnkiSettingsItemWrapper>
        )
        break
      case 'export':
        rightPanelContent = (
          <AnkiSettingsItemWrapper
            backButton_goBack={navigateToSettings}
            header={
              <>
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {LL.ANKI.EXPORT.TITLE()}
                </h2>
                <p className="text-default-500 text-sm mt-1">{LL.ANKI.EXPORT.DESCRIPTION()}</p>
              </>
            }
          >
            <AnkiExport />
          </AnkiSettingsItemWrapper>
        )
        break
      default:
        rightPanelContent = <AnkiGeneralSettings />
        break
    }

    const isRightPanelVisibleOnMobile = route.subPage !== undefined

    return (
      <AnkiGameLayout
        counts={counts}
        direction={direction}
        headerPage="settings"
        isRightPanelVisibleOnMobile={isRightPanelVisibleOnMobile}
        leftSidebarContent={leftSidebarContent}
        rightPanelContent={rightPanelContent}
        urlLanguage={urlLanguage}
        onDirectionChange={setDirection}
        onExit={exitAnki}
      />
    )
  }

  // --- BRANCH 2: Game Mode (Active) ---
  if (currentLanguage_favoriteItems) {
    return (
      <AnkiGameActiveSession
        counts={counts}
        direction={direction}
        favorites={currentLanguage_favoriteItems}
        setDirection={setDirection}
        urlLanguage={urlLanguage}
        onExit={exitAnki}
      />
    )
  }

  // --- BRANCH 3: Game Mode (Empty / No Favorites) ---
  const emptyLeftContent = (
    <div className="flex flex-1 items-center justify-center p-4 text-center text-default-400">
      {LL.ANKI.NO_FAVORITES()}
    </div>
  )

  const emptyRightContent = (
    <div className="flex h-full flex-col items-center justify-center text-default-400 gap-2">
      <span className="text-4xl">📭</span>
      <p>{LL.ANKI.NO_FAVORITES()}</p>
    </div>
  )

  return (
    <AnkiGameLayout
      counts={counts}
      direction={direction}
      headerPage={urlLanguage}
      isRightPanelVisibleOnMobile={false}
      leftSidebarContent={emptyLeftContent}
      rightPanelContent={emptyRightContent}
      urlLanguage={urlLanguage}
      onDirectionChange={setDirection}
      onExit={exitAnki}
    />
  )
})

AnkiGameController.displayName = 'AnkiGameController'

// --- 6. Entry Point ---

export const AnkiGame = React.memo(function AnkiGame() {
  const { favorites: allFavorites, loading } = useFavorites()

  const allFavorites_splitted = useMemo(() => {
    if (!Array_isNonEmptyArray(allFavorites)) return undefined

    return allFavorites_split_sorted(allFavorites)
  }, [allFavorites])

  if (loading) return LoadingSpinner

  return <AnkiGameController allFavorites_splitted={allFavorites_splitted} />
})

AnkiGame.displayName = 'AnkiGame'
