import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { Set_mkOrThrowIfArrayIsNotUnique } from './sets'
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

export interface EnglishKhmerCache {
  readonly db: EnKmComDbConnection
  readonly __brandEnglishKhmerCache: 'EnglishKhmerCache'
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
  return path.join(baseDir, 'english-khmer-com-cache2.sqlite')
}

type EnKmComDbConnection = Database & { readonly __brandEnKmComDbConnection: 'EnKmComDbConnection' }

const ensureDb = (readonly: boolean): EnKmComDbConnection => {
  return ensureDbGeneral(
    readonly,
    getDbPath(),
    `CREATE TABLE IF NOT EXISTS ek_entries (
    word TEXT PRIMARY KEY,
    status INTEGER NOT NULL, -- 200 or 404
    html TEXT
  )`,
  ) as EnKmComDbConnection
}

export const EnglishKhmerCache_create = async ({ readonly }: { readonly: boolean }): Promise<EnglishKhmerCache> => {
  const db = ensureDb(readonly)

  const stmtHas = db.prepare('SELECT 1 FROM ek_entries WHERE word = ?')
  const stmtGet = db.prepare('SELECT status, html FROM ek_entries WHERE word = ?')
  const stmtInsert = db.prepare(`
    INSERT OR REPLACE INTO ek_entries (word, status, html)
    VALUES ($word, $status, $html)
  `)
  const stmtGetAll = db.prepare('SELECT word FROM ek_entries')
  const stmtGetSuccessEntries = db.prepare('SELECT word, html FROM ek_entries WHERE status = 20')

  return {
    db,
    __brandEnglishKhmerCache: 'EnglishKhmerCache',
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

export const getKhmerWordsFromEnglishKhmerCacheContent = (cache: EnglishKhmerCache): Set<TypedKhmerWord> => {
  const result = new Set<TypedKhmerWord>()
  cache.forEachSuccessEntry((_word, html) => {
    for (const w of strToUniqueKhmerWords(html)) result.add(w)
  })
  return result
}

export const getLatinWordsFromEnglishKhmerCacheContent = (cache: EnglishKhmerCache): Set<StringLowercaseLatin> => {
  const result = new Set<StringLowercaseLatin>()
  cache.forEachSuccessEntry((_word, html) => {
    for (const w of strToUniqueLowercaseLatinWords(html)) result.add(w)
  })
  return result
}

/**
 * Optimized: Instead of returning a new Set, it populates an existing one.
 * It checks against an 'exclude' set immediately to prevent the Set from growing
 * with words we already have in our target cache.
 */
export const populateLatinWordsFromCacheContent = (
  cache: EnglishKhmerCache,
  targetSet: Set<StringLowercaseLatin>,
  excludeSet: Set<NonEmptyStringTrimmed>, // These are words we ALREADY have cached
): void => {
  cache.forEachSuccessEntry((_word, html) => {
    // Extract words from this specific HTML entry
    const found = strToUniqueLowercaseLatinWords(html)
    for (const w of found) {
      // ONLY add to the target set if it's not already in the target cache
      if (!excludeSet.has(w)) {
        targetSet.add(w)
      }
    }
  })
}
