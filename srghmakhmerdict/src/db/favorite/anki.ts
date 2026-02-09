import { getUserDb } from '../core'
import { createDeck, Grade } from 'femto-fsrs' // Assuming you saved the file there
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import type { FavoriteItem } from './item'

// Initialize the FSRS algorithm (Default parameters)
export const deck = createDeck()

export const getOneDayInMs = 24 * 60 * 60 * 1000

/**
 * Handle a user reviewing a card.
 * Uses functional patterns to calculate the next state immutably.
 */
export const reviewCard = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  grade: Grade, // 1=Again, 2=Hard, 3=Good, 4=Easy
): Promise<void> => {
  const db = await getUserDb()
  const now = Date.now()

  // 1. Fetch current state
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

  // 2. Calculate next state using femto-fsrs (Pure calculation via IIFE)
  const { nextCard /*, nextState, lapseIncrement */ } = (() => {
    const isNew = current.last_review === null // || current.state === 0

    // Branch A: New Card
    if (isNew) {
      return {
        nextCard: deck.newCard(grade),
        // nextState: grade === Grade.AGAIN ? 1 : 2 // Simple state logic: Again->Learning, else->Review
        // lapseIncrement: 0
      }
    }

    // Branch B: Existing Card
    const daysSinceReview = (now - current.last_review) / getOneDayInMs

    // Logic for State transitions (Future)
    // const nextState = (() => {
    //   if (grade === Grade.AGAIN) return 3 // Relearning
    //   if (current.state === 3 && grade >= Grade.GOOD) return 2 // Back to Review
    //   if (current.state === 1 && grade >= Grade.GOOD) return 2 // Graduate to Review
    //   return current.state
    // })()

    return {
      nextCard: deck.gradeCard({ D: current.difficulty, S: current.stability }, daysSinceReview, grade),
      // nextState,
      // lapseIncrement: grade === Grade.AGAIN ? 1 : 0
    }
  })()

  // 3. Update DB
  // We calculate 'due' by adding Interval (I) days to NOW
  const nextDue = now + nextCard.I * getOneDayInMs

  await db.execute(
    `
    UPDATE favorites SET
      stability = $3,
      difficulty = $4,
      last_review = $5,
      due = $6
    WHERE word = $1 AND language = $2
    `,
    // -- reps = reps + 1,
    // -- lapses = lapses + $7,
    // -- state = $8
    [
      word,
      language,
      nextCard.S,
      nextCard.D,
      now,
      nextDue,
      // lapseIncrement,
      // nextState,
    ],
  )
}

// export type FavoriteToAnkiDataNonEmptyMap = NonEmptyMap<NonEmptyStringTrimmed, FavoriteAnkiData>

// export const getFavoritesWithAnkiDataFor = async (
//   language: DictionaryLanguage,
//   // ): Promise<FavoriteToAnkiDataNonEmptyMap | undefined> => {
// ): Promise<FavoriteAnkiData[]> => {
//   const db = await getUserDb()
//
//   // Select all columns
//   const rows = await db.select<FavoriteAnkiData[]>('SELECT * FROM favorites WHERE language = $1 ORDER BY due ASC', [
//     language,
//   ])
//
//   return rows
//
//   // const map = new Map<NonEmptyStringTrimmed, FavoriteAnkiData>()
//   //
//   // for (const row of rows) map.set(row.word, row)
//   //
//   // return Map_toNonEmptyMap_orUndefined(map)
// }
