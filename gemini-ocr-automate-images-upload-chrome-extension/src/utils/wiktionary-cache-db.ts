import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { Set_flatMap, Set_mkOrThrowIfArrayIsNotUnique } from './sets'
import { assertIsDefinedAndReturn } from './asserts'
import { strToUniqueKhmerWords, type TypedKhmerWord } from './khmer-word'
import { strToUniqueLowercaseLatinWords, type StringLowercaseLatin } from './string-lowercase-latin'
import { ensureDbGeneral } from './db-utils'

// -- Type Definitions --

export interface CacheEntrySuccess {
  readonly word: NonEmptyStringTrimmed
  readonly html: NonEmptyStringTrimmed
}

export interface CacheEntry404 {
  readonly word: NonEmptyStringTrimmed
  readonly status: 404
}

export type CacheEntry = CacheEntrySuccess | CacheEntry404

export interface CacheGetOuput_Success {
  readonly t: 'success'
  readonly html: NonEmptyStringTrimmed
}

export interface CacheGetOuput_404 {
  readonly t: '404'
}

export type CacheGetOuput = CacheGetOuput_Success | CacheGetOuput_404

export interface WiktionaryCache<Mode extends 'en' | 'ru'> {
  readonly has: (word: NonEmptyStringTrimmed) => boolean
  readonly get: (word: NonEmptyStringTrimmed) => CacheGetOuput | undefined
  readonly addSuccess: (word: NonEmptyStringTrimmed, html: NonEmptyStringTrimmed) => Promise<void>
  readonly add404: (word: NonEmptyStringTrimmed) => Promise<void>
  readonly getAllWords: () => Set<NonEmptyStringTrimmed>
  readonly forEachSuccessEntry: (callback: (entry: CacheEntrySuccess) => void) => void
  readonly iterateSuccessEntries: () => IterableIterator<CacheEntrySuccess>
  readonly __dbMode: Mode
}

// -- Database Setup --

type WikiDbConnection<Mode extends 'en' | 'ru'> = Database & {
  readonly __dbMode: Mode
  readonly __brandWikiDbConnection: 'WikiDbConnection'
}

export const getDbPath = (ruOrEn: 'en' | 'ru'): string => {
  const baseDir = process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`
  return path.join(
    baseDir,
    ruOrEn === 'en' ? 'my-translate-srt-files-cache.sqlite' : 'my-translate-srt-files-cache-ru.sqlite',
  )
}

const ensureDb = <Mode extends 'en' | 'ru'>(ruOrEn: Mode, readonly: boolean): WikiDbConnection<Mode> => {
  return ensureDbGeneral(
    readonly,
    getDbPath(ruOrEn),
    `
CREATE TABLE IF NOT EXISTS wiktionary_entries (
  word TEXT PRIMARY KEY,
  status INTEGER NOT NULL,
  html TEXT
)`,
  ) as WikiDbConnection<Mode>
}

// -- Implementation --

export const WiktionaryCache_create = async <Mode extends 'en' | 'ru'>(
  ruOrEn: Mode,
  { readonly }: { readonly: boolean },
): Promise<WiktionaryCache<Mode>> => {
  const db = ensureDb(ruOrEn, readonly)

  // Pre-prepare statements for performance
  const stmtHas = db.prepare('SELECT 1 FROM wiktionary_entries WHERE word = ?')
  const stmtGet = db.prepare('SELECT status, html FROM wiktionary_entries WHERE word = ?')
  const stmtInsert = db.prepare(`
    INSERT OR REPLACE INTO wiktionary_entries (word, status, html)
    VALUES ($word, $status, $html)
  `)
  const stmtGetAll = db.prepare('SELECT word FROM wiktionary_entries')
  const stmtGetSuccessEntries = db.prepare('SELECT word, html FROM wiktionary_entries WHERE status = 100')

  return {
    __dbMode: ruOrEn,
    has: word => {
      return stmtHas.get(word) !== null
    },

    get: word => {
      const row = stmtGet.get(word) as { status: number; html: string | null } | undefined

      if (!row) return undefined

      if (row.status === 404) {
        return { t: '404' }
      }

      if (row.status === 200) {
        return { t: 'success', html: nonEmptyString_afterTrim(assertIsDefinedAndReturn(row.html)) }
      }

      // Fallback if data is corrupted (e.g. status 200 but null html)
      return undefined
    },

    addSuccess: async (word, html) => {
      stmtInsert.run({
        $word: word,
        $status: 200,
        $html: html,
      })
    },

    add404: async word => {
      stmtInsert.run({
        $word: word,
        $status: 404,
        $html: null,
      })
    },

    getAllWords: () => {
      // bun:sqlite .all() returns an array of objects: [{ word: "..." }, { word: "..." }]
      const rows = stmtGetAll.all() as { word: string }[]

      // Map to strings and convert to Set
      // We cast to NonEmptyString assuming the DB data is valid based on addSuccess/add404 inputs
      return Set_mkOrThrowIfArrayIsNotUnique(rows.map(row => nonEmptyString_afterTrim(row.word)))
    },

    forEachSuccessEntry: callback => {
      // iterate() is faster than all() as it doesn't build a massive intermediate array
      for (const row of stmtGetSuccessEntries.iterate() as IterableIterator<{ word: string; html: string }>) {
        callback({
          word: nonEmptyString_afterTrim(row.word),
          html: nonEmptyString_afterTrim(row.html),
        })
      }
    },

    iterateSuccessEntries: function* () {
      for (const row of stmtGetSuccessEntries.iterate() as IterableIterator<{ word: string; html: string }>) {
        yield { word: nonEmptyString_afterTrim(row.word), html: nonEmptyString_afterTrim(row.html) }
      }
    },
  }
}

export const getKhmerWordsFromWiktionaryCacheContent = <Mode extends 'en' | 'ru'>(
  cache: WiktionaryCache<Mode>,
): Set<TypedKhmerWord> => {
  const allWordsInCache = cache.getAllWords()
  return Set_flatMap(allWordsInCache, word => {
    const entry = cache.get(word)
    if (entry && entry.t === 'success') return strToUniqueKhmerWords(entry.html)
    return new Set<TypedKhmerWord>()
  })
}

export const getLatinWordsFromWiktionaryCacheContent = <Mode extends 'en' | 'ru'>(
  cache: WiktionaryCache<Mode>,
): Set<StringLowercaseLatin> => {
  const result = new Set<StringLowercaseLatin>()
  cache.forEachSuccessEntry(({ html }) => {
    const words = strToUniqueLowercaseLatinWords(html)
    for (const w of words) result.add(w)
  })
  return result
}
