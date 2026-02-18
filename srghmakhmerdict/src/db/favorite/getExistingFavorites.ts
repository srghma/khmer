import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type Database from '@tauri-apps/plugin-sql'
import type { DictionaryLanguage } from '../../types'

export async function getExistingFavorites(
  userDb: Database,
  lang: DictionaryLanguage,
  items: NonEmptySet<NonEmptyStringTrimmed>,
): Promise<Set<string>> {
  const CHUNK_SIZE = 450
  const existing = new Set<string>()
  const words = Array.from(items.keys())

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE)
    const placeholders = chunk.map((_, idx) => `$${idx + 2}`).join(', ')

    const rows = await userDb.select<{ word: string }[]>(
      `SELECT word FROM favorites WHERE language = $1 AND word IN (${placeholders})`,
      [lang, ...chunk],
    )

    for (const r of rows) {
      existing.add(r.word)
    }
  }

  return existing
}
