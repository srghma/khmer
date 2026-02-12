import React, { useCallback, useMemo, useSyncExternalStore, useState, useEffect } from 'react'
import { Button } from '@heroui/button'
import { IoArrowBack } from 'react-icons/io5'
import { Grade } from 'femto-fsrs'
import { AnkiContent } from './AnkiContent'
import { AnkiListItem } from './AnkiListItem'
import { AnkiHeader } from './AnkiHeader'
import { AnkiRatingButtons, AnkiRevealButton } from './AnkiButtons'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useAnkiSettings } from './useAnkiSettings'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { mkFourButtons, type FourButtons } from './utils'
import { numberToValidNonNegativeIntOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

import type { DictionaryLanguage } from '../../types'
import type { AnkiDirection } from './types'
import type { FavoriteItem } from '../../db/favorite/item'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { AnkiGameHookResult } from './useAnkiGameManager'
import type { LanguageToShortDefinitionSum } from '../../db/dict'

// --- 1. Stateless UI: Mobile Header ---

const AnkiMobileHeader = React.memo(({ onBack }: { onBack: () => void }) => (
  <div className="md:hidden flex items-center px-4 py-2 border-b border-divider bg-background/80 backdrop-blur-md sticky top-0 z-30">
    <Button isIconOnly variant="light" onPress={onBack}>
      <IoArrowBack size={24} />
    </Button>
    <span className="ml-4 font-bold text-lg">Back to List</span>
  </div>
))

AnkiMobileHeader.displayName = 'AnkiMobileHeader'

// --- 2. Stateless UI: Sidebar (Header + List) ---

interface AnkiSidebarProps<T> {
  language: DictionaryLanguage
  count: number
  direction: AnkiDirection
  tabStates_en: boolean
  tabStates_ru: boolean
  tabStates_km: boolean
  items: T[]
  selectedWord: string | undefined
  onDictChange: (l: DictionaryLanguage) => void
  onDirectionChange: (d: AnkiDirection) => void
  onSelect: (item: FavoriteItem) => void
  getCard: (item: T) => FavoriteItem
  getDescription?: (item: T) => LanguageToShortDefinitionSum
}

function AnkiSidebarImpl<T>({
  language,
  count,
  direction,
  tabStates_en,
  tabStates_ru,
  tabStates_km,
  items,
  selectedWord,
  onDictChange,
  onDirectionChange,
  onSelect,
  getCard,
  getDescription,
}: AnkiSidebarProps<T>) {
  return (
    <div className="flex flex-col h-full">
      <AnkiHeader
        activeDict={language}
        count={count}
        direction={direction}
        isEnTabDisabled={tabStates_en}
        isKhTabDisabled={tabStates_km}
        isRuTabDisabled={tabStates_ru}
        onDictChange={onDictChange}
        onDirectionChange={onDirectionChange}
      />
      <div className="flex-1 overflow-y-auto bg-content1">
        {items.map(item => {
          const card = getCard(item)

          return (
            <AnkiListItem
              key={card.word}
              card={card}
              description={getDescription?.(item)}
              direction={direction}
              isSelected={selectedWord === card.word}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
const AnkiSidebar = React.memo(AnkiSidebarImpl) as typeof AnkiSidebarImpl

// --- 3. Stateless UI: Main Content Shell ---

interface AnkiSessionMainProps<T> {
  currentItem: T | undefined
  isRevealed: boolean
  language: DictionaryLanguage
  direction: AnkiDirection
  getCard: (item: T) => FavoriteItem
  renderFront: (item: T) => React.ReactNode
  renderBack: (item: T) => React.ReactNode
}

function AnkiSessionMainImpl<T>({
  currentItem,
  isRevealed,
  language,
  direction,
  getCard,
  renderFront,
  renderBack,
}: AnkiSessionMainProps<T>) {
  if (!currentItem) {
    return <div className="flex h-full items-center justify-center text-default-400">Select a card to start</div>
  }
  const card = getCard(currentItem)

  return (
    <AnkiContent
      cardWord={card.word}
      frontContent={() => renderFront(currentItem)}
      isCardWordHidden={
        (language === 'km' && direction === 'GUESSING_NON_KHMER') ||
        (language !== 'km' && direction === 'GUESSING_KHMER')
      }
      isRevealed={isRevealed}
      language={language}
      richContent={() => renderBack(currentItem)}
    />
  )
}
const AnkiSessionMain = React.memo(AnkiSessionMainImpl) as typeof AnkiSessionMainImpl

// --- 4. Stateless UI: Bottom Bar ---

const AnkiSessionBottomBar = React.memo(
  ({
    isBack,
    buttons,
    handleRate,
    handleReveal,
  }: {
    isBack: boolean
    buttons?: FourButtons
    handleRate?: (g: Grade) => void
    handleReveal?: () => void
  }) => (
    <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-lg rounded-2xl border border-default-200 bg-background/90 shadow-lg backdrop-blur-md dark:bg-default-100/50 pointer-events-auto">
        {isBack && buttons && handleRate ? (
          <AnkiRatingButtons buttons={buttons} onRate={handleRate} />
        ) : handleReveal ? (
          <AnkiRevealButton disabled={false} onReveal={handleReveal} />
        ) : null}
      </div>
    </div>
  ),
)

AnkiSessionBottomBar.displayName = 'AnkiSessionBottomBar'

// --- 5. Main Component (The Orchestrator) ---

export interface AnkiGameSessionContentProps<T> {
  language: DictionaryLanguage
  direction: AnkiDirection
  items: NonEmptyArray<T>
  getCard: (item: T) => FavoriteItem
  getDescription: ((item: T) => LanguageToShortDefinitionSum) | undefined
  renderFront: (item: T) => React.ReactNode
  renderBack: (item: T) => React.ReactNode
  gameState: Exclude<AnkiGameHookResult<T>, { t: 'loading' }>
}

export function AnkiGameSession_Content<T>(props: AnkiGameSessionContentProps<T>) {
  const { language, direction, items, getCard, getDescription, renderFront, renderBack, gameState } = props

  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)
  const allFavoritesStore = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot)
  const settings = useAnkiSettings()

  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)

  // Memoized derived data
  const { tabStates, dueCount } = useMemo(() => {
    if (!allFavoritesStore) return { tabStates: { en: true, ru: true, km: true }, dueCount: 0 }
    const langs = {
      en: allFavoritesStore.filter(f => f.language === 'en'),
      ru: allFavoritesStore.filter(f => f.language === 'ru'),
      km: allFavoritesStore.filter(f => f.language === 'km'),
    }
    const current = language === 'en' ? langs.en : language === 'ru' ? langs.ru : langs.km

    return {
      tabStates: { en: langs.en.length === 0, ru: langs.ru.length === 0, km: langs.km.length === 0 },
      dueCount: current.filter(f => f.due <= Date.now()).length,
    }
  }, [allFavoritesStore, language])

  const currentItem =
    gameState.t !== 'no_more_due_cards_today__nothing_selected' ? gameState.state.currentItem : undefined
  const selectedWord = currentItem ? getCard(currentItem).word : undefined
  const isBack =
    gameState.t === 'have_due_cards_today__selected__back' || gameState.t === 'no_more_due_cards_today__selected__back'

  const buttons = useMemo(
    () => (isBack && currentItem ? mkFourButtons(currentItem, now, getCard) : undefined),
    [isBack, currentItem, now, getCard],
  )
  const handleRate = isBack ? gameState.rate : undefined
  const handleReveal =
    gameState.t === 'have_due_cards_today__selected__front' ||
      gameState.t === 'no_more_due_cards_today__selected__front'
      ? gameState.reveal
      : undefined

  // Effects & Callbacks
  useEffect(() => {
    if (selectedWord) setIsMobileDetailOpen(true)
  }, [selectedWord])

  const onSelect = useCallback(
    (card: FavoriteItem) => {
      const index = items.findIndex(it => getCard(it).word === card.word)

      if (index === -1) return
      const validIndex = assertIsDefinedAndReturn(numberToValidNonNegativeIntOrUndefined(index))

      if (gameState.t === 'no_more_due_cards_today__nothing_selected') gameState.selectCard(validIndex)
      else if ('selectOtherCard' in gameState) gameState.selectOtherCard(validIndex)
      setIsMobileDetailOpen(true)
    },
    [items, getCard, gameState],
  )

  const onDirectionChange = useCallback(
    (d: AnkiDirection) => {
      if (language === 'en') settings.setDirection_en(d)
      else if (language === 'ru') settings.setDirection_ru(d)
      else settings.setDirection_km(d)
    },
    [language, settings],
  )

  return (
    <div className="flex h-full w-full bg-background relative overflow-hidden">
      {/* Sidebar Section */}
      <div
        className={`flex flex-col border-r border-divider bg-background transition-all md:w-[350px] shrink-0 ${isMobileDetailOpen ? 'hidden md:flex' : 'w-full flex'}`}
      >
        <AnkiSidebar
          count={dueCount}
          direction={direction}
          getCard={getCard}
          getDescription={getDescription}
          items={items}
          language={language}
          selectedWord={selectedWord}
          tabStates={tabStates}
          onDictChange={settings.setLanguage}
          onDirectionChange={onDirectionChange}
          onSelect={onSelect}
        />
      </div>

      {/* Content Section */}
      <div
        className={`flex flex-col bg-background transition-all ${isMobileDetailOpen ? 'fixed inset-0 z-50 md:static md:inset-auto md:flex-1 md:z-auto' : 'hidden md:flex md:flex-1'}`}
      >
        <AnkiMobileHeader onBack={() => setIsMobileDetailOpen(false)} />
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnkiSessionMain
            currentItem={currentItem}
            direction={direction}
            getCard={getCard}
            isRevealed={isBack}
            language={language}
            renderBack={renderBack}
            renderFront={renderFront}
          />
          {currentItem && (
            <AnkiSessionBottomBar
              buttons={buttons}
              handleRate={handleRate}
              handleReveal={handleReveal}
              isBack={isBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}
