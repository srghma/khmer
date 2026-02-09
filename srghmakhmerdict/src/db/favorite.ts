import { getUserDb } from './core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { type NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { FavoriteItem_mk, type FavoriteItem } from './favorite/item'

export const removeFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  const db = await getUserDb()
  const result = await db.execute('DELETE FROM favorites WHERE word = $1 AND language = $2', [word, language])

  return result.rowsAffected > 0
}

/**
 * Removes multiple favorites in efficient batches.
 */
export const removeFavoritesMany = async (
  items: NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage>,
): Promise<void> => {
  const db = await getUserDb()

  // Convert Map entries to array for chunking
  const entries = [...items.entries()]

  // SQLite has a limit on host parameters (often 999).
  // Each entry uses 2 parameters (word, language), so we chunk by 450.
  const CHUNK_SIZE = 450

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE)

    // Construct: (word = $1 AND language = $2) OR (word = $3 AND language = $4) ...
    const clauses = chunk.map((_, idx) => `(word = $${idx * 2 + 1} AND language = $${idx * 2 + 2})`)
    const params = chunk.flatMap(([word, lang]) => [word, lang])

    await db.execute(`DELETE FROM favorites WHERE ${clauses.join(' OR ')}`, params)
  }
}

export const addFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<void> => {
  const db = await getUserDb()
  const now = Date.now()

  // 1. Create the default item structure using your pure constructor
  const item = FavoriteItem_mk(word, language, now)

  await db.execute(
    `
BEGIN;

INSERT INTO favorites (
  word,
  language,
  timestamp,
  stability,
  difficulty,
  due,
  last_review
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT(word, language) DO UPDATE
  SET timestamp = excluded.timestamp;

DELETE FROM favorites
WHERE rowid NOT IN (
  SELECT rowid
  FROM favorites
  ORDER BY timestamp DESC
  LIMIT 1000
);

COMMIT;
`,
    [item.word, item.language, item.timestamp, item.stability, item.difficulty, item.due, item.last_review],
  )
}

/**
 * Atomic Toggle Logic
 * 1. Tries to delete the row using existing removeFavorite.
 * 2. If no row was deleted (it didn't exist), it inserts it using addFavorite.
 * 3. Returns true if it ended up being inserted (now a favorite), false otherwise.
 */
export const toggleFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  // 1. Try to remove it first
  const wasRemoved = await removeFavorite(word, language)

  if (wasRemoved) {
    // It existed and was removed, so it's no longer a favorite.
    return false
  }

  // 2. If it wasn't removed, it didn't exist, so we add it.
  // addFavorite already contains the INSERT logic and the 1000-item cleanup.
  await addFavorite(word, language)

  return true
}

export const isFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  const db = await getUserDb()
  const rows = await db.select<{ c: number }[]>('SELECT 1 as c FROM favorites WHERE word = $1 AND language = $2', [
    word,
    language,
  ])

  return rows.length > 0
}

// export const getFavorites = async (): Promise<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined> => {
export const getFavorites = async (): Promise<FavoriteItem[]> => {
  const db = await getUserDb()

  const rows = await db.select<FavoriteItem[]>(
    `SELECT word, language, timestamp, stability, difficulty, due, last_review
FROM favorites ORDER BY timestamp DESC`,
  )

  return rows

  // const map = new Map<NonEmptyStringTrimmed, DictionaryLanguage>()
  // for (const row of rows) map.set(row.word, row.language)
  // return Map_toNonEmptyMap_orUndefined(map)
}

export const deleteAllFavorites = async (): Promise<void> => {
  const db = await getUserDb()

  await db.execute('DELETE FROM favorites')
}
