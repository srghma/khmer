import React, { useCallback, useMemo } from 'react'
import { Button } from '@heroui/button'
import { GoArrowLeft } from 'react-icons/go'
import { Grade } from 'femto-fsrs'
import { deck } from '../../db/favorite/anki'
import { mkFourButtons, type FourButtons } from './utils'
import { AnkiRevealButton, AnkiRatingButtons } from './AnkiButtons'
import { DetailFetcher } from './DetailFetcher'
import { useAnkiCurrentDirection } from './useAnkiCurrentDirection'
import type { FavoriteItem } from '../../db/favorite/item'
import type { KhmerWordsMap } from '../../db/dict'
import type { DictionaryLanguage } from '../../types'

export type GameState = {
  selectedId: string | null
  isRevealed: boolean
}

interface AnkiPlayAreaProps {
  item: FavoriteItem
  isRevealed: boolean
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  onBack: () => void
  km_map: KhmerWordsMap
  language: DictionaryLanguage
}

export const AnkiPlayArea = React.memo(function AnkiPlayArea({
  item,
  isRevealed,
  setGameState,
  onBack,
  km_map,
  language,
}: AnkiPlayAreaProps) {
  const [direction] = useAnkiCurrentDirection()
  const isGuessingKhmer = direction === 'GUESSING_KHMER'

  const handleRate = useCallback(
    async (rating: Grade) => {
      const now = Date.now()

      item.last_review === null
        ? deck.newCard(rating)
        : deck.gradeCard(
          { D: item.difficulty, S: item.stability },
          (now - item.last_review) / (24 * 60 * 60 * 1000),
          rating,
        )

      // DB update logic would go here
      // await updateFavorite({ ... })

      setGameState({ selectedId: null, isRevealed: false })
    },
    [item, setGameState],
  )

  const buttons: FourButtons = useMemo(() => mkFourButtons(item, Date.now(), i => i), [item])

  const handleReveal = useCallback(() => {
    setGameState(prev => ({ ...prev, isRevealed: true }))
  }, [setGameState])

  const QuestionSection = useMemo(
    () => (
      <div className="flex flex-col gap-4">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest">
          {isGuessingKhmer ? 'Translate to Khmer' : 'Translate / Define'}
        </span>
        <div className="text-4xl md:text-5xl font-bold break-words leading-tight">
          {isGuessingKhmer ? (
            <span className="text-foreground">{item.word}</span>
          ) : (
            <span className="font-khmer text-primary">{item.word}</span>
          )}
        </div>
      </div>
    ),
    [isGuessingKhmer, item.word],
  )

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex md:hidden items-center px-2 py-2 border-b border-divider bg-background/80 backdrop-blur-md">
        <Button isIconOnly size="sm" variant="light" onPress={onBack}>
          <GoArrowLeft className="text-xl" />
        </Button>
        <span className="font-bold ml-2 line-clamp-1">{item.word}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col gap-8 text-center pt-8">
          {QuestionSection}

          {isRevealed && (
            <div className="flex flex-col gap-4 animate-appearance-in text-left">
              <div className="w-full h-px bg-divider my-4" />
              <span className="text-small uppercase text-default-400 font-bold tracking-widest text-center">
                Answer
              </span>

              <div className="bg-background/50 rounded-lg border border-divider p-4 shadow-sm">
                <DetailFetcher hideKhmer={false} km_map={km_map} language={language} word={item.word} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 bg-content1/90 backdrop-blur-lg border-t border-divider pb-[env(safe-area-inset-bottom)] p-4 flex justify-center">
        {!isRevealed ? (
          <AnkiRevealButton onReveal={handleReveal} />
        ) : (
          <AnkiRatingButtons buttons={buttons} onRate={handleRate} />
        )}
      </div>
    </div>
  )
})

AnkiPlayArea.displayName = 'AnkiPlayArea'
