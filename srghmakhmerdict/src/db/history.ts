import { getUserDb } from './core'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'

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

export const getHistory = async (): Promise<HistoryItem[]> => {
  const db = await getUserDb()

  return await db.select<HistoryItem[]>('SELECT word, language FROM history ORDER BY timestamp DESC')
}
