import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import { getUserDb } from '../core'

/**
 * Updates the front/back HTML for a favorite card.
 */
export async function updateFavoriteHtml(
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  update_to: 'additional_html_front' | 'additional_html_back',
  data: NonEmptyStringTrimmed | undefined,
): Promise<void> {
  const db = await getUserDb()

  const sql = `
    UPDATE favorites
    SET ${update_to} = $1
    WHERE word = $2 AND language = $3
  `

  const params = [data ?? null, word, language]

  await db.execute(sql, params)
}
