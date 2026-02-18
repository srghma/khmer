import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type Database from '@tauri-apps/plugin-sql'
import type { DictionaryLanguage } from '../../types'

export type MaybeFrontBack =
  | { front: NonEmptyStringTrimmed; back: undefined }
  | { front: undefined; back: NonEmptyStringTrimmed }
  | { front: NonEmptyStringTrimmed; back: NonEmptyStringTrimmed }

export function MaybeFrontBack_mk(
  front: NonEmptyStringTrimmed | undefined,
  back: NonEmptyStringTrimmed | undefined,
): MaybeFrontBack | undefined {
  if (front && back) return { front, back }
  if (front) return { front, back: undefined }
  if (back) return { front: undefined, back }

  return undefined
}

export async function bulkInsertFavorites_front_back_html(
  userDb: Database,
  lang: DictionaryLanguage,
  items: Map<NonEmptyStringTrimmed, MaybeFrontBack | undefined>,
  now: number,
): Promise<number> {
  const itemsArray = Array.from(items.entries())

  if (itemsArray.length === 0) return 0

  const CHUNK_SIZE = 50
  let totalInserted = 0

  for (let i = 0; i < itemsArray.length; i += CHUNK_SIZE) {
    const chunk = itemsArray.slice(i, i + CHUNK_SIZE)

    const rowsSql = chunk
      .map((_, idx) => {
        const offset = idx * 9

        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
      })
      .join(', ')

    const params = chunk.flatMap(([word, maybeFrontBack]) => [
      word,
      lang,
      now,
      0, // stability
      0, // difficulty
      now, // due
      null, // last_review
      maybeFrontBack?.front ?? null,
      maybeFrontBack?.back ?? null,
    ])

    await userDb.execute(
      `INSERT INTO favorites
      (word, language, timestamp, stability, difficulty, due, last_review, additional_html_front, additional_html_back)
      VALUES ${rowsSql}`,
      params,
    )

    totalInserted += chunk.length
  }

  return totalInserted
}
