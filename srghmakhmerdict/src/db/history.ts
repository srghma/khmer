import { getUserDb } from './core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { type NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'

export const addToHistory = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<void> => {
  const db = await getUserDb()
  const timestamp = Date.now()

  await db.execute(
    `
BEGIN;

INSERT INTO history (word, language, timestamp)
VALUES ($1, $2, $3)
ON CONFLICT(word, language) DO UPDATE
  SET timestamp = excluded.timestamp;

DELETE FROM history
WHERE rowid NOT IN (
  SELECT rowid
  FROM history
  ORDER BY timestamp DESC
  LIMIT 1000
);

COMMIT;
    `,
    [word, language, timestamp],
  )
}

export interface HistoryItem {
  readonly word: NonEmptyStringTrimmed
  readonly language: DictionaryLanguage
}

// export const getHistory = async (): Promise<NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined> => {
export const getHistory = async (): Promise<HistoryItem[]> => {
  const db = await getUserDb()

  const rows = await db.select<HistoryItem[]>('SELECT word, language FROM history ORDER BY timestamp DESC')

  return rows

  // const map = new Map<NonEmptyStringTrimmed, DictionaryLanguage>()
  //
  // for (const row of rows) {
  //   map.set(row.word, row.language)
  // }
  //
  // return Map_toNonEmptyMap_orUndefined(map)
}

export const removeHistoryItem = async (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
): Promise<boolean> => {
  const db = await getUserDb()
  const result = await db.execute('DELETE FROM history WHERE word = $1 AND language = $2', [word, language])

  return result.rowsAffected > 0
}

/**
 * Removes multiple history items in efficient batches.
 */
export const removeHistoryMany = async (
  items: NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage>,
): Promise<void> => {
  const db = await getUserDb()

  // Convert Map entries to array for chunking
  const entries = [...items.entries()]

  // SQLite limit on host parameters is usually 999.
  // Each entry uses 2 parameters, so chunk by 450.
  const CHUNK_SIZE = 450

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE)

    const clauses = chunk.map((_, idx) => `(word = $${idx * 2 + 1} AND language = $${idx * 2 + 2})`)
    const params = chunk.flatMap(([word, lang]) => [word, lang])

    await db.execute(`DELETE FROM history WHERE ${clauses.join(' OR ')}`, params)
  }
}

export const deleteAllHistory = async (): Promise<void> => {
  const db = await getUserDb()

  await db.execute('DELETE FROM history')
}
