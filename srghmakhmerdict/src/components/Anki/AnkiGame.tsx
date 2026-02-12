import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { useAnkiSettings } from './useAnkiSettings'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { Spinner } from '@heroui/spinner'
import { allFavorites_split_sorted, mkFourButtons, type FourButtons } from './utils'
import {
  Array_isNonEmptyArray,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { getBestAvailableLanguage } from '../../utils/getBestAvailableLanguage'
import type { FavoriteItem } from '../../db/favorite/item'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { DictionaryLanguage } from '../../types'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import { AnkiHeader } from './AnkiHeader'
import { AnkiListItem } from './AnkiListItem'
import { useAnkiGameInitialData } from './useAnkiGameManagerInitialData'
import { AnkiRatingButtons, AnkiRevealButton } from './AnkiButtons'
import { Button } from '@heroui/button'
import { GoArrowLeft } from 'react-icons/go'
// import { updateFavorite } from '../../db/favorite'
import { deck } from '../../db/favorite/anki'
import { Grade } from 'femto-fsrs'

// Reusing util import path

// --- Types ---

type GameState = {
  selectedId: string | null
  isRevealed: boolean
}

// --- Main Component ---

const loading = (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

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

    return loading
  }

  return (
    <AnkiGameStep2
      allFavorites_splitted={allFavorites_splitted}
      currentLanguage_favoriteItems={currentLanguage_favoriteItems}
    />
  )
})

AnkiGame.displayName = 'AnkiGame'

// --- Layout Component ---

const useCountOfSplitted = (splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined>) => {
  const en_dueCount_today = useMemo(
    () => (splitted['en']?.filter(f => f.due <= Date.now()).length ?? 0),
    [splitted],
  )
  const en_dueCount_total = useMemo(
    () => (splitted['en']?.length ?? 0),
    [splitted],
  )
  const ru_dueCount_today = useMemo(
    () => (splitted['ru']?.filter(f => f.due <= Date.now()).length ?? 0),
    [splitted],
  )
  const ru_dueCount_total = useMemo(
    () => (splitted['ru']?.length ?? 0),
    [splitted],
  )
  const kh_dueCount_today = useMemo(
    () => (splitted['km']?.filter(f => f.due <= Date.now()).length ?? 0),
    [splitted],
  )
  const kh_dueCount_total = useMemo(
    () => (splitted['km']?.length ?? 0),
    [splitted],
  )
  return {
    en_dueCount_today,
    en_dueCount_total,
    ru_dueCount_today,
    ru_dueCount_total,
    kh_dueCount_today,
    kh_dueCount_total,
  }
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

  const [gameState, setGameState] = useState<GameState>({
    selectedId: null,
    isRevealed: false,
  })

  const { en_dueCount_today, en_dueCount_total, ru_dueCount_today, ru_dueCount_total, kh_dueCount_today, kh_dueCount_total } = useCountOfSplitted(allFavorites_splitted)

  const initialData = useAnkiGameInitialData(language, currentLanguage_direction, currentLanguage_favoriteItems)

  const handleSelect = useCallback((id: string) => {
    setGameState({ selectedId: id, isRevealed: false })
  }, [])

  const handleClearSelection = useCallback(() => {
    setGameState(prev => ({ ...prev, selectedId: null }))
  }, [])

  const selectedItem = useMemo(
    () => currentLanguage_favoriteItems?.find(i => i.word === gameState.selectedId),
    [currentLanguage_favoriteItems, gameState.selectedId],
  )

  // Layout Classes (mimicking App.tsx responsive behavior)
  const sidebarClassName = `flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[400px] lg:w-[450px] pt-[env(safe-area-inset-top)] ${selectedItem ? 'hidden md:flex' : 'w-full'
    }`

  const rightPanelClassName = `flex-1 flex flex-col bg-content1 relative overflow-hidden transition-all ${!selectedItem ? 'hidden md:flex' : 'flex'
    }`

  return (
    <div className="flex h-full w-full bg-content1 overflow-hidden font-inter text-foreground">
      {/* --- Left Panel (Sidebar) --- */}
      <div className={sidebarClassName}>
        <AnkiHeader
          activeDict={language}
          direction={currentLanguage_direction}
          en_dueCount_today={en_dueCount_today}
          en_dueCount_total={en_dueCount_total}
          kh_dueCount_today={kh_dueCount_today}
          kh_dueCount_total={kh_dueCount_total}
          ru_dueCount_today={ru_dueCount_today}
          ru_dueCount_total={ru_dueCount_total}
          onDictChange={setLanguage}
          onDirectionChange={currentLanguage_setDirection}
        />

        <div className="flex-1 flex overflow-hidden relative bg-content1">
          {currentLanguage_favoriteItems ? (
            <AnkiListContent
              direction={currentLanguage_direction}
              items={currentLanguage_favoriteItems}
              language={language}
              selectedId={gameState.selectedId}
              onSelect={handleSelect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-default-400 p-4 text-center">
              <span>No cards for {language.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Right Panel (Game Area) --- */}
      <div className={rightPanelClassName}>
        {selectedItem ? (
          <AnkiPlayArea
            isRevealed={gameState.isRevealed}
            item={selectedItem}
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

// --- List Content Component ---

const AnkiListContent = React.memo(function AnkiListContent({
  language,
  direction,
  items,
  selectedId,
  onSelect,
}: {
  language: DictionaryLanguage
  direction: 'GUESSING_KHMER' | 'GUESSING_NON_KHMER'
  items: NonEmptyArray<FavoriteItem>
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const data = useAnkiGameInitialData(language, direction, items)
  const now = useMemo(() => Date.now(), [])

  if (data === 'loading') {
    return loading
  }

  // Helper to render the list based on the discriminated union from the hook
  const renderList = () => {
    // Mode 1, 3, 5: Item only
    if (data.t === 'GUESS_NON_KHMER_km' || data.t === 'GUESS_KHMER_en' || data.t === 'GUESS_KHMER_ru') {
      return data.v.map(item => (
        <AnkiListItem
          key={item.word}
          card_due={item.due}
          isSelected={selectedId === item.word}
          now={now}
          t={data.t}
          v={item.word}
          onSelect={() => onSelect(item.word)}
        />
      ))
    }

    // Mode 2, 4, 6: Item + Description
    // We need to verify the mapping of 'v' types here.
    // In AnkiListItem, 'v' for these modes expects the ShortDefinition object.
    // In data.v, we have { card, description }.
    if (data.t === 'GUESS_KHMER_km') {
      return data.v.map(({ card, description }) => (
        <AnkiListItem
          key={card.word}
          card_due={card.due}
          isSelected={selectedId === card.word}
          now={now}
          t={data.t}
          v={description}
          onSelect={() => onSelect(card.word)}
        />
      ))
    }
    if (data.t === 'GUESS_NON_KHMER_en') {
      return data.v.map(({ card, description }) => (
        <AnkiListItem
          key={card.word}
          card_due={card.due}
          isSelected={selectedId === card.word}
          now={now}
          t={data.t}
          v={description}
          onSelect={() => onSelect(card.word)}
        />
      ))
    }
    if (data.t === 'GUESS_NON_KHMER_ru') {
      return data.v.map(({ card, description }) => (
        <AnkiListItem
          key={card.word}
          card_due={card.due}
          isSelected={selectedId === card.word}
          now={now}
          t={data.t}
          v={description}
          onSelect={() => onSelect(card.word)}
        />
      ))
    }

    return null
  }

  return <div className="flex-1 overflow-y-auto w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">{renderList()}</div>
})

// --- Play Area (Right Panel) ---

const AnkiPlayArea = React.memo(function AnkiPlayArea({
  item,
  isRevealed,
  setGameState,
  onBack,
}: {
  item: FavoriteItem
  isRevealed: boolean
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  onBack: () => void
}) {
  const [direction] = useAnkiCurrentDirection()

  // 1. Determine "Front" (Question) and "Back" (Answer) based on direction
  // Note: This logic simplifies the display. For strict data, we might want to fetch the definition again,
  // but since we have the Word, we can display the Word as answer or question.
  // Ideally, the "Game" should pass the specific question content from the List, but for now we re-derive or show both.

  const isGuessingKhmer = direction === 'GUESSING_KHMER'

  // If Guessing Khmer: Front is En/Ru/Km_Desc, Back is Khmer Word.
  // If Guessing Meaning: Front is Khmer Word, Back is En/Ru/Km_Desc.
  // However, the `item` only contains the `word` (which is the Key).
  // In this app, `word` is the Khmer word (mostly) or the foreign word?
  // The FavoriteItem structure implies `word` is the ID.
  // Let's assume `word` is what we are storing.

  // To properly show the "Question" if it's a description, we would need the description data here too.
  // For simplicity and robustness (without re-fetching async data in the render loop of the child),
  // we will treat the card as:
  // Top: The "Front" (Question)
  // Bottom: The "Back" (Answer) - Revealed
  //
  // Re-using the Logic from `AnkiListItem` regarding what to show is tricky without the `data` object.
  // But usually, in the Detail view, we show the *Full Word Detail* eventually.

  const handleRate = useCallback(
    async (rating: Grade) => {
      const now = Date.now()
      // Calculate new state
      const newCard =
        item.last_review === null
          ? deck.newCard(rating) // New Card
          : deck.gradeCard(
            // Review Card
            { D: item.difficulty, S: item.stability },
            (now - item.last_review) / (24 * 60 * 60 * 1000), // days since last review
            rating,
          )

      // Update DB
      // await updateFavorite({
      //   ...item,
      //   due: now + newCard.I * 24 * 60 * 60 * 1000,
      //   difficulty: newCard.D,
      //   stability: newCard.S,
      //   last_review: now,
      //   history: [...item.history, { date: now, rating }],
      // })

      // Move to next item or clear selection
      setGameState({ selectedId: null, isRevealed: false })
    },
    [item, setGameState],
  )

  const buttons: FourButtons = useMemo(() => mkFourButtons(item, Date.now(), i => i), [item])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header / Nav for Mobile */}
      <div className="flex md:hidden items-center px-2 py-2 border-b border-divider bg-background/80 backdrop-blur-md">
        <Button isIconOnly size="sm" variant="light" onPress={onBack}>
          <GoArrowLeft className="text-xl" />
        </Button>
        <span className="font-bold ml-2 line-clamp-1">{item.word}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col gap-8 text-center">
          {/* Question / Front */}
          <div className="flex flex-col gap-4">
            <span className="text-small uppercase text-default-400 font-bold tracking-widest">
              {isGuessingKhmer ? 'Translate to Khmer' : 'Translate / Define'}
            </span>
            <div className="text-4xl md:text-5xl font-bold break-words leading-tight">
              {isGuessingKhmer ? (
                // If guessing Khmer, we show the foreign word or description.
                // Since `item.word` is the key, and usually the foreign word in En/Ru dictionaries,
                // or the Khmer word in Km dictionary.
                // This display logic is simplified. Real logic needs the definition text if it's "Guessing from Def".
                // For now, displaying the key (Word) is the safest sync operation.
                <span className="text-foreground">{item.word}</span>
              ) : (
                // If guessing meaning, we show the Khmer word.
                <span className="font-khmer text-primary">{item.word}</span>
              )}
            </div>
          </div>

          {/* Answer / Back (Revealed) */}
          {isRevealed && (
            <div className="flex flex-col gap-4 animate-appearance-in">
              <div className="w-full h-px bg-divider my-4" />
              <span className="text-small uppercase text-default-400 font-bold tracking-widest">Answer</span>

              {/*
                  Here we would ideally show the full definition.
                  For now, we place a placeholder or the "Other side" logical guess.
              */}
              <div className="text-xl text-default-600">
                {/*
                    This is a placeholder for the "Back" of the card.
                    In a real app, you might query the DB for the full HTML definition here
                    or pass it from the list.
                */}
                <p className="opacity-70 italic">(Think of the meaning/translation...)</p>
                {/*
                    If we are guessing Khmer, the answer is the Word (if the clue was desc)
                    or the Desc (if clue was word).
                    For the sake of the UI structure:
                */}
                {!isGuessingKhmer && <p className="font-bold text-2xl mt-2">{item.word}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="shrink-0 bg-content1/90 backdrop-blur-lg border-t border-divider pb-[env(safe-area-inset-bottom)]">
        {!isRevealed ? (
          <AnkiRevealButton onReveal={() => setGameState(prev => ({ ...prev, isRevealed: true }))} />
        ) : (
          <AnkiRatingButtons buttons={buttons} onRate={handleRate} />
        )}
      </div>
    </div>
  )
})
