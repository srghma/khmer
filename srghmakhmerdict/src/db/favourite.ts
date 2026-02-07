import { getUserDb } from './core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import {
  Map_toNonEmptyMap_orUndefined,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'

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
  const timestamp = Date.now()

  await db.execute(
    `
BEGIN;

INSERT INTO favorites (word, language, timestamp)
VALUES ($1, $2, $3)
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
    [word, language, timestamp],
  )
}

/**
 * Atomic One-Statement Toggle
 * 1. Tries to delete the row.
 * 2. If no row was deleted, it inserts it.
 * 3. Returns true if it ended up being inserted (now a favorite), false otherwise.
 */
export const toggleFavorite = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  toast_warn: (title: string, description?: string) => void,
): Promise<boolean> => {
  const db = await getUserDb()
  const now = Date.now()

  // We use a CTE to perform the toggle in one logical statement.
  // This requires SQLite 3.35+ (standard in modern Tauri environments).
  const result = await db.select<{ res: string }[]>(
    `
    WITH deleted AS (
      DELETE FROM favorites
      WHERE word = $1 AND language = $2
      RETURNING 'removed' as res
    ),
    inserted AS (
      INSERT INTO favorites (word, language, timestamp)
      SELECT $1, $2, $3
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
      RETURNING 'added' as res
    )
    SELECT res FROM deleted UNION ALL SELECT res FROM inserted;
    `,
    [word, language, now],
  )

  // Side effect: Cleanup older items (maintenance)
  // We do this separately so the primary toggle stays as fast as possible.
  db.execute(
    'DELETE FROM favorites WHERE rowid NOT IN (SELECT rowid FROM favorites ORDER BY timestamp DESC LIMIT 1000)',
  ).catch(e => toast_warn('Favorite cleanup failed:', e))

  return result[0]?.res === 'added'
}

export const isFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  const db = await getUserDb()
  const rows = await db.select<{ c: number }[]>('SELECT 1 as c FROM favorites WHERE word = $1 AND language = $2', [
    word,
    language,
  ])

  return rows.length > 0
}

export const getFavorites = async (): Promise<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined> => {
  const db = await getUserDb()

  interface FavouriteItem {
    readonly word: NonEmptyStringTrimmed
    readonly language: DictionaryLanguage
  }

  const rows = await db.select<FavouriteItem[]>('SELECT word, language FROM favorites ORDER BY timestamp DESC')

  const map = new Map<NonEmptyStringTrimmed, DictionaryLanguage>()

  for (const row of rows) {
    map.set(row.word, row.language)
  }

  return Map_toNonEmptyMap_orUndefined(map)
}

export const deleteAllFavourites = async (): Promise<void> => {
  const db = await getUserDb()

  await db.execute('DELETE FROM favorites')
}
