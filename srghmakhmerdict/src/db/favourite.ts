import { getUserDb } from './core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'

export interface FavouriteItem {
  readonly word: NonEmptyStringTrimmed
  readonly language: DictionaryLanguage
}

// TODO: add removeFavorite many
export const removeFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<void> => {
  const db = await getUserDb()

  await db.execute('DELETE FROM favorites WHERE word = $1 AND language = $2', [word, language])
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

export const isFavorite = async (word: NonEmptyStringTrimmed, language: DictionaryLanguage): Promise<boolean> => {
  const db = await getUserDb()
  const rows = await db.select<{ c: number }[]>('SELECT 1 as c FROM favorites WHERE word = $1 AND language = $2', [
    word,
    language,
  ])

  return rows.length > 0
}

export const getFavorites = async (): Promise<FavouriteItem[]> => {
  const db = await getUserDb()

  return await db.select<FavouriteItem[]>('SELECT word, language FROM favorites ORDER BY timestamp DESC')
}

export const deleteAllFavourites = async (): Promise<void> => {
  const db = await getUserDb()

  await db.execute('DELETE FROM favourites')
}
