import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  isContainsKhmer,
  type TypedContainsKhmer,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { getUserDb } from '../core'
import {
  Set_isNonEmptySet,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { DictionaryLanguage } from '../../types'
import { areWordsInDict } from '../dict/is_in_db'
import type Database from '@tauri-apps/plugin-sql'
import {
  strToCyrillicPhrase_orUndefined_normalize,
  type StringCyrillicPhrase,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-cyrillic-phrase'
import { type Lazy, defer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/lazy'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

export type LangImportResult<T> = {
  success: number
  skipped: number
  notFound: T[]
}

export type ImportResult = {
  en: LangImportResult<NonEmptyStringTrimmed>
  km: LangImportResult<TypedContainsKhmer>
  ru: LangImportResult<NonEmptyStringTrimmed>
}

type Partitioned = {
  en: Set<NonEmptyStringTrimmed>
  km: Set<TypedContainsKhmer>
  ru: Set<NonEmptyStringTrimmed>
}

function partitionByLanguage(words: NonEmptySet<NonEmptyStringTrimmed>): Partitioned {
  const partitioned: Partitioned = { en: new Set(), km: new Set(), ru: new Set() }

  for (const word of words) {
    const ru: Lazy<StringCyrillicPhrase | undefined> = defer(() => strToCyrillicPhrase_orUndefined_normalize(word))

    if (isContainsKhmer(word)) {
      partitioned.km.add(word)
    } else if (ru()) {
      partitioned.ru.add(assertIsDefinedAndReturn(ru()))
    } else {
      partitioned.en.add(word)
    }
  }

  return partitioned
}

async function getExistingFavorites(
  userDb: Database,
  lang: DictionaryLanguage,
  words: NonEmptyStringTrimmed[],
): Promise<Set<string>> {
  const CHUNK_SIZE = 450
  const existing = new Set<string>()

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

async function bulkInsertFavorites(
  userDb: Database,
  lang: DictionaryLanguage,
  words: NonEmptyStringTrimmed[],
  now: number,
): Promise<number> {
  if (words.length === 0) return 0

  const CHUNK_SIZE = 100
  let totalInserted = 0

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE)
    const rowsSql = chunk
      .map(
        (_, idx) =>
          `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`,
      )
      .join(', ')

    const params = chunk.flatMap(word => [word, lang, now, 0, 0, now, null])

    await userDb.execute(
      `INSERT INTO favorites (word, language, timestamp, stability, difficulty, due, last_review) VALUES ${rowsSql}`,
      params,
    )

    totalInserted += chunk.length
  }

  return totalInserted
}

async function processLanguageImport<T extends NonEmptyStringTrimmed>(
  userDb: Database,
  lang: DictionaryLanguage,
  inDb: T[],
  notFound: T[],
  now: number,
): Promise<LangImportResult<T>> {
  const existingInFavorites = await getExistingFavorites(userDb, lang, inDb)

  const toInsert = inDb.filter(word => !existingInFavorites.has(word))
  const success = await bulkInsertFavorites(userDb, lang, toInsert, now)

  return {
    success,
    skipped: existingInFavorites.size,
    notFound,
  }
}

export async function importWordsToAnki(input: string): Promise<ImportResult> {
  const lines = input.split('\n')
  const allWordsSet: Set<NonEmptyStringTrimmed> = new Set()

  for (const line of lines) {
    const trimmed = String_toNonEmptyString_orUndefined_afterTrim(line)

    if (trimmed) {
      allWordsSet.add(trimmed)
    }
  }

  if (!Set_isNonEmptySet(allWordsSet)) {
    return {
      en: { success: 0, skipped: 0, notFound: [] },
      km: { success: 0, skipped: 0, notFound: [] },
      ru: { success: 0, skipped: 0, notFound: [] },
    }
  }

  const partitioned = partitionByLanguage(allWordsSet)

  const areInDb = await areWordsInDict({
    en: partitioned.en,
    ru: partitioned.ru,
    km: partitioned.km,
  })

  const userDb = await getUserDb()
  const now = Date.now()

  const enRes = await processLanguageImport(userDb, 'en', areInDb.en.inDb, areInDb.en.notInDb, now)
  const kmRes = await processLanguageImport(userDb, 'km', areInDb.km.inDb, areInDb.km.notInDb, now)
  const ruRes = await processLanguageImport(userDb, 'ru', areInDb.ru.inDb, areInDb.ru.notInDb, now)

  return {
    en: enRes,
    km: kmRes,
    ru: ruRes,
  }
}
