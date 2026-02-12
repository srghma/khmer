import { getUserDb } from '../core'
import { Grade } from 'femto-fsrs'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import type { FavoriteItem } from './item'
import { reviewCard_calculateReviewUpdates } from '../../components/Anki/utils'

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
  updates: Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review' | 'due'>,
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

  const updates = reviewCard_calculateReviewUpdates(current, grade, now)

  await reviewCardImplementation(word, language, updates)

  return {
    ...current,
    ...updates,
  }
}
