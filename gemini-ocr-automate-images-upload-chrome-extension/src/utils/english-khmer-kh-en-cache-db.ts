import { Database } from 'bun:sqlite'
import * as path from 'path'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { Set_flatMap, Set_mkOrThrowIfArrayIsNotUnique } from './sets'
import { type TypedKhmerWord, strToUniqueKhmerWords } from './khmer-word'
import { type StringLowercaseLatin, strToUniqueLowercaseLatinWords } from './string-lowercase-latin'
import { assertIsDefinedAndReturn } from './asserts'
import { ensureDbGeneral } from './db-utils'

// -- Types --

export interface EKCacheGet_Success {
  readonly t: 'success'
  readonly html: NonEmptyStringTrimmed
}

export interface EKCacheGet_404 {
  readonly t: '404'
}

export type EKCacheGet = EKCacheGet_Success | EKCacheGet_404

export interface EnglishKhmerKhEnCache {
  readonly db: EnKmComKmEnDbConnection
  readonly __brandKhmerEnglishCache: 'KhmerEnglishCache'
  readonly has: (word: NonEmptyStringTrimmed) => boolean
  readonly get: (word: NonEmptyStringTrimmed) => EKCacheGet | undefined
  readonly addSuccess: (word: NonEmptyStringTrimmed, html: NonEmptyStringTrimmed) => Promise<void>
  readonly add404: (word: NonEmptyStringTrimmed) => Promise<void>
  readonly getAllWords: () => Set<NonEmptyStringTrimmed>
  readonly forEachSuccessEntry: (callback: (word: NonEmptyStringTrimmed, html: NonEmptyStringTrimmed) => void) => void
  readonly iterateSuccessEntries: () => IterableIterator<{ word: NonEmptyStringTrimmed; html: NonEmptyStringTrimmed }>
}

// -- Implementation --

const getDbPath = (): string => {
  const baseDir = process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`
  return path.join(baseDir, 'english-khmer-com-kh-en-cache.sqlite')
}

type EnKmComKmEnDbConnection = Database & { readonly __brandEnKmComKmEnDbConnection: 'EnKmComKmEnDbConnection' }

const ensureDb = (readonly: boolean): EnKmComKmEnDbConnection => {
  return ensureDbGeneral(
    readonly,
    getDbPath(),
    `
CREATE TABLE IF NOT EXISTS ek_kh_en_entries (
  word TEXT PRIMARY KEY,
  status INTEGER NOT NULL, -- 200 or 404
  html TEXT
)`,
  ) as EnKmComKmEnDbConnection
}

export const EnglishKhmerKhEnCache_create = async ({
  readonly,
}: {
  readonly: boolean
}): Promise<EnglishKhmerKhEnCache> => {
  const db = ensureDb(readonly)

  const stmtHas = db.prepare('SELECT 1 FROM ek_kh_en_entries WHERE word = ?')
  const stmtGet = db.prepare('SELECT status, html FROM ek_kh_en_entries WHERE word = ?')
  const stmtInsert = db.prepare(`
    INSERT OR REPLACE INTO ek_kh_en_entries (word, status, html)
    VALUES ($word, $status, $html)
  `)
  const stmtGetAll = db.prepare('SELECT word FROM ek_kh_en_entries')
  const stmtGetSuccessEntries = db.prepare('SELECT word, html FROM ek_kh_en_entries WHERE status = 200')

  return {
    db,
    __brandKhmerEnglishCache: 'KhmerEnglishCache',
    has: word => stmtHas.get(word) !== null,

    get: word => {
      const row = stmtGet.get(word) as { status: number; html: string | null } | undefined
      if (!row) return undefined
      if (row.status === 404) return { t: '404' }
      if (row.status === 200)
        return { t: 'success', html: nonEmptyString_afterTrim(assertIsDefinedAndReturn(row.html)) }
      return undefined
    },

    addSuccess: async (word, html) => {
      stmtInsert.run({ $word: word, $status: 200, $html: html })
    },

    add404: async word => {
      stmtInsert.run({ $word: word, $status: 404, $html: null })
    },

    getAllWords: () => {
      const rows = stmtGetAll.all() as { word: string }[]
      const words = rows.map(r => r.word).map(nonEmptyString_afterTrim)
      return Set_mkOrThrowIfArrayIsNotUnique(words)
    },

    forEachSuccessEntry: callback => {
      for (const row of stmtGetSuccessEntries.iterate() as IterableIterator<{ word: string; html: string }>) {
        callback(nonEmptyString_afterTrim(row.word), nonEmptyString_afterTrim(row.html))
      }
    },
    iterateSuccessEntries: function* () {
      for (const row of stmtGetSuccessEntries.iterate() as IterableIterator<{ word: string; html: string }>) {
        yield { word: nonEmptyString_afterTrim(row.word), html: nonEmptyString_afterTrim(row.html) }
      }
    },
  }
}

export const getKhmerWordsFromEnglishKhmerKhEnCacheContent = (cache: EnglishKhmerKhEnCache): Set<TypedKhmerWord> => {
  const allWordsInCache = cache.getAllWords()
  return Set_flatMap(allWordsInCache, word => {
    const entry = cache.get(word)
    if (entry && entry.t === 'success') return strToUniqueKhmerWords(entry.html)
    return new Set<TypedKhmerWord>()
  })
}

export const getLatinWordsFromEnglishKhmerKhEnCacheContent = (
  cache: EnglishKhmerKhEnCache,
): Set<StringLowercaseLatin> => {
  const result = new Set<StringLowercaseLatin>()
  cache.forEachSuccessEntry((_word, html) => {
    for (const w of strToUniqueLowercaseLatinWords(html)) result.add(w)
  })
  return result
}

export const populateLatinWordsFromEnglishKhmerKhEnCacheContent = (
  cache: EnglishKhmerKhEnCache,
  targetSet: Set<StringLowercaseLatin>,
  excludeSet: Set<NonEmptyStringTrimmed>,
): void => {
  cache.forEachSuccessEntry((_word, html) => {
    for (const w of strToUniqueLowercaseLatinWords(html)) {
      if (!excludeSet.has(w)) {
        targetSet.add(w)
      }
    }
  })
}
