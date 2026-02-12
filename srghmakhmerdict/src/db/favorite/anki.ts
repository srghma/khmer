import { getUserDb } from '../core'
import { createDeck, Grade } from 'femto-fsrs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import type { FavoriteItem } from './item'

// Initialize the FSRS algorithm
export const deck = createDeck()

export const getOneDayInMs = 24 * 60 * 60 * 1000

export type FavoriteItemUpdates = Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review' | 'due'>

/**
 * Pure function: Calculates the next state of a card based on the grade and current time.
 * This determines the "optimistic" data without touching the database.
 */
export const calculateReviewUpdates = (
  item: Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number,
): FavoriteItemUpdates => {
  const isNew = item.last_review === null

  // Calculate next FSRS parameters
  const nextCard = (() => {
    if (isNew) {
      // Branch A: New Card
      return deck.newCard(grade)
    } else {
      // Branch B: Existing Card
      const daysSinceReview = (now - item.last_review) / getOneDayInMs

      return deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview, grade)
    }
  })()

  // Calculate next due date
  const nextDue = now + nextCard.I * getOneDayInMs

  return {
    stability: nextCard.S,
    difficulty: nextCard.D,
    last_review: now,
    due: nextDue,
  }
}

export async function getCurrent(word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<FavoriteItem> {
  const db = await getUserDb()

  const rows = await db.select<FavoriteItem[]>('SELECT * FROM favorites WHERE word = $1 AND language = $2', [
    word,
    language,
  ])

  // Validation
  const current = (() => {
    if (rows.length === 0) throw new Error('Card should already exist')
    if (rows.length > 1) throw new Error(`Card should be unique, but got ${rows.length}`)
    const c = rows[0]

    if (!c) throw new Error(`Card is empty`)

    return c
  })()

  return current
}

export async function reviewCardImplementation(
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  updates: FavoriteItemUpdates,
): Promise<void> {
  const db = await getUserDb()

  await db.execute(
    `
    UPDATE favorites SET
      stability = $3,
      difficulty = $4,
      last_review = $5,
      due = $6
    WHERE word = $1 AND language = $2
    `,
    [word, language, updates.stability, updates.difficulty, updates.last_review, updates.due],
  )
}

/**
 * Impure function: retrieval and database update.
 */
export const reviewCard = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  grade: Grade,
): Promise<FavoriteItem> => {
  const now = Date.now()

  const current = await getCurrent(word, language)

  const updates = calculateReviewUpdates(current, grade, now)

  await reviewCardImplementation(word, language, updates)

  return {
    ...current,
    ...updates,
  }
}
