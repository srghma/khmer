import React, { useCallback, useMemo, useSyncExternalStore } from 'react'
import { AnkiContent } from './AnkiContent'
import { AnkiListItem } from './AnkiListItem'
import type { DictionaryLanguage } from '../../types'
import type { AnkiDirection } from './types'
import { mkFourButtons, type FourButtons } from './utils'
import { useAnkiPulseStore } from './AnkiPulseContext'
import type { FavoriteItem } from '../../db/favorite/item'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { numberToValidNonNegativeIntOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { AnkiGameHookResult } from './useAnkiGameManager'
import { AnkiRatingButtons, AnkiRevealButton } from './AnkiButtons'
import type { LanguageToShortDefinitionSum } from '../../db/dict'
import type { Grade } from 'femto-fsrs'

// --- Stateless Sub-Components ---

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

interface AnkiSessionBottomBarProps {
  isBack: boolean
  buttons: FourButtons | undefined
  handleRate: ((rating: Grade) => void) | undefined
  handleReveal: (() => void) | undefined
}

const AnkiSessionBottomBar = React.memo(({ isBack, buttons, handleRate, handleReveal }: AnkiSessionBottomBarProps) => {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-default-200 bg-background/90 p-2 shadow-lg backdrop-blur-md dark:bg-default-100/50">
        {isBack && buttons && handleRate ? (
          <AnkiRatingButtons buttons={buttons} onRate={handleRate} />
        ) : handleReveal ? (
          <AnkiRevealButton disabled={false} onReveal={handleReveal} />
        ) : null}
      </div>
    </div>
  )
})

AnkiSessionBottomBar.displayName = 'AnkiSessionBottomBar'

// --- Main Component ---

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

export function AnkiGameSession_Content<T>({
  language,
  direction,
  items,
  getCard,
  getDescription,
  renderFront,
  renderBack,
  gameState,
}: AnkiGameSessionContentProps<T>) {
  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  const hasSelection = gameState.t !== 'no_more_due_cards_today__nothing_selected'
  const currentItem = hasSelection ? gameState.state.currentItem : undefined
  const selectedWord = currentItem ? getCard(currentItem).word : undefined

  const isBack =
    gameState.t === 'have_due_cards_today__selected__back' || gameState.t === 'no_more_due_cards_today__selected__back'

  const buttons = useMemo(() => {
    if (!isBack || !currentItem) return undefined

    return mkFourButtons(currentItem, now, getCard)
  }, [isBack, currentItem, now, getCard])

  const handleRate = isBack ? gameState.rate : undefined

  const handleReveal =
    gameState.t === 'have_due_cards_today__selected__front' ||
    gameState.t === 'no_more_due_cards_today__selected__front'
      ? gameState.reveal
      : undefined

  const handleSelect = useCallback(
    (card: FavoriteItem) => {
      const index = items.findIndex(it => getCard(it).word === card.word)

      if (index === -1) return

      const validIndex = assertIsDefinedAndReturn(numberToValidNonNegativeIntOrUndefined(index))

      if (gameState.t === 'no_more_due_cards_today__nothing_selected') {
        gameState.selectCard(validIndex)
      } else if ('selectOtherCard' in gameState) {
        gameState.selectOtherCard(validIndex)
      }
    },
    [items, getCard, gameState],
  )

  return (
    <div className="flex h-full w-full bg-background">
      {/* Left List (Merged) */}
      <div className="flex w-full shrink-0 flex-col border-r border-divider bg-background md:w-[350px]">
        <div className="flex-1 overflow-y-auto bg-content1">
          {items.map(item => (
            <AnkiListItem
              key={getCard(item).word}
              card={getCard(item)}
              description={getDescription?.(item)}
              direction={direction}
              isSelected={selectedWord === getCard(item).word}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Right Content */}
      <div className="relative flex flex-1 flex-col bg-background">
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
          <AnkiSessionBottomBar buttons={buttons} handleRate={handleRate} handleReveal={handleReveal} isBack={isBack} />
        )}
      </div>
    </div>
  )
}
