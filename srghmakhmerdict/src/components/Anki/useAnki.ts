import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

// --- FSRS Imports ---
import type { Rating, Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---
import { getKmWordsDetailFull, type WordDetailKm } from '../../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { Record_stripNullValuesOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'
import { useToast } from '../../providers/ToastProvider'
import { AnkiStateManager } from './AnkiStateManager'
import { Array_isNonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { Record_toNonEmptyRecord_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

export const useAnki = (items: TypedContainsKhmer[], isOpen: boolean) => {
  const manager = useMemo(() => new AnkiStateManager(), [])
  const toast = useToast()

  const [cards, setCards] = useState<Record<TypedContainsKhmer, FSRSCard>>({})
  const [definitions, setDefinitions] = useState<Record<TypedContainsKhmer, WordDetailKm>>({})
  const [selectedWord, setSelectedWord] = useState<TypedContainsKhmer | undefined>(undefined)
  const [isRevealed, setIsRevealed] = useState(false)

  // Use a ref to track if we have performed the initial sync for this "open session"
  // This prevents the "setState in useEffect" infinite loop/cascade warning.
  const isSyncedRef = useRef(false)

  // 1. Reset sync flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      isSyncedRef.current = false
      setIsRevealed(false)
      setSelectedWord(undefined)
    }
  }, [isOpen])

  // 2. Sync Logic (Run once when opened)
  useEffect(() => {
    if (!isOpen || !Array_isNonEmptyArray(items) || isSyncedRef.current) return

    // A. Load & Sync Cards
    const fromStorage = manager.loadCards()
    const { cards: nextCards, hasChanges } = manager.syncCards(items, fromStorage)

    if (hasChanges) {
      manager.saveCards(nextCards)
    }

    setCards(nextCards)

    // B. Initial Selection
    const nextDue: TypedContainsKhmer = manager.findNextDue(items, nextCards)

    setSelectedWord(nextDue)

    // Mark as synced so we don't re-run this block during this open session
    isSyncedRef.current = true
  }, [isOpen, items, manager])

  // 3. Fetch Definitions (Async)
  useEffect(() => {
    if (!isOpen) return
    const items_ = Set_toNonEmptySet_orUndefined(new Set(items))

    if (!items_) return

    let active = true

    getKmWordsDetailFull(items_)
      .then(res => {
        const res_: Record<TypedContainsKhmer, WordDetailKm> = Record_stripNullValuesOrThrow(res)

        if (active) setDefinitions(res_)
      })
      .catch((err: any) => toast.error('Failed to fetch anki definitions', err.message))

    return () => {
      active = false
    }
  }, [isOpen, items, toast])

  // Actions
  const handleRate = useCallback(
    (rating: Rating) => {
      if (!selectedWord) return

      const card = cards[selectedWord]

      if (!card) return

      // Logic
      const newCard = manager.reviewCard(card, rating)
      const updatedCards = { ...cards, [selectedWord]: newCard }

      // Update State & Storage
      setCards(updatedCards)
      manager.saveCards(Record_toNonEmptyRecord_orThrow(updatedCards))

      // UI Transition
      setIsRevealed(false)

      // Find next word (Simple sequential approach relative to current list order)
      // Note: We don't re-sort by due date immediately to avoid UI jumping,
      // but you could use manager.findNextDue(items, updatedCards) if you prefer.
      const currentIndex = items.indexOf(selectedWord)
      const nextWord = items[(currentIndex + 1) % items.length]

      setSelectedWord(nextWord)
    },
    [cards, selectedWord, items, manager],
  )

  const handleSelect = useCallback((word: TypedContainsKhmer) => {
    setSelectedWord(word)
    setIsRevealed(false)
  }, [])

  const nextIntervals = useMemo(() => {
    if (!selectedWord || !cards[selectedWord]) return undefined

    return manager.getNextIntervals(cards[selectedWord])
  }, [selectedWord, cards, manager])

  return {
    cards,
    definitions,
    selectedWord,
    isRevealed,
    setIsRevealed,
    handleRate,
    handleSelect,
    nextIntervals,
  }
}
