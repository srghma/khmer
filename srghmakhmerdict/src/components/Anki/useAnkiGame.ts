import { useState } from 'react'
import { Grade } from 'femto-fsrs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getFavorites } from '../../db/favorite'
import type { FavoriteItem } from '../../db/favorite/item'
import { reviewCard } from '../../db/favorite/anki'
import { favoritesStore } from '../../externalStores/historyAndFavorites'
import { useAppToast } from '../../providers/ToastProvider'
import type { DictionaryLanguage } from '../../types'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { type NextIntervals, getPreviewIntervals } from './utils'
import { AnkiCardsResult_empty, AnkiCardsResult_loading, useAnkiCards } from './useAnkiCard'

export type AnkiGameState =
  | typeof AnkiCardsResult_loading
  | typeof AnkiCardsResult_empty
  | {
    t: 'review'
    currentCard: FavoriteItem
    nextIntervals: NextIntervals
    isRevealed: boolean
    remainingCount: number
    queue: ReadonlyArray<FavoriteItem>
    isProcessing: boolean

    // Actions
    reveal: () => void
    rate: (grade: Grade) => Promise<void>
  }

export function useAnkiGame(language: DictionaryLanguage): AnkiGameState {
  const cardsState = useAnkiCards(language)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const toast = useAppToast()

  if (cardsState.t !== 'ready') return cardsState

  const currentCard = cardsState.dueQueue[0]
  const nextIntervals = getPreviewIntervals(currentCard)

  const reveal = () => setIsRevealed(true)

  const rate = async (grade: Grade) => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await reviewCard(currentCard.word, currentCard.language, grade)
      const updatedData = await getFavorites()

      favoritesStore.replaceStateWith_emitOnlyIfDifferentRef(updatedData)
      setIsRevealed(false)
    } catch (e) {
      toast.error('Failed to save review' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    t: 'review',
    currentCard,
    nextIntervals,
    isRevealed,
    remainingCount: cardsState.dueQueue.length,
    queue: cardsState.dueQueue,
    isProcessing,
    reveal,
    rate,
  }
}
