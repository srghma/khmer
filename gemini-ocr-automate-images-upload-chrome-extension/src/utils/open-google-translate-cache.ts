// import * as translator from "open-google-translator"
// import { Database, open } from "sqlite"
// import * as sqlite3 from "sqlite3"
// "@types/sqlite3": "^3.1.11",
// "sqlite": "^5.1.1",
// "sqlite3": "^5.1.7",

import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { type NonEmptySet } from './non-empty-set'
import { Map_mkOrThrowIfDuplicateKeys } from './map'
import { type NonEmptyMap } from './non-empty-map'
import { forEachChunked } from './async'
import { type LanguageCode } from './google-translate-puppeteer'

// --- Utils ---

// Prior to SQLite version 3.32.0 (May 2020): The default limit was 999 variables.
// Version 3.32.0 and later: The default limit was raised to 32766 variables.
//
// SQLite's hard limit for variables in a single statement (SELECT ... IN (...))
// Modern SQLite default is 32766.
const SQL_MAX_VARS = 32766

// --- Database Layer ---

export type DbConnection =
  // Database<sqlite3.Database, sqlite3.Statement>
  Database & {
    __brand: 'TranslationsDb'
  }

const defaultPath: NonEmptyStringTrimmed =
  `${process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`}/my-translate-srt-files-cache.sqlite` as NonEmptyStringTrimmed

export const openDB = (customPath?: NonEmptyStringTrimmed): DbConnection => {
  const dbPath = customPath ?? defaultPath
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // const db = await open({
  //   filename: dbPath,
  //   driver: sqlite3.Database,
  // })

  // Bun:sqlite is synchronous and faster
  const db = new Database(dbPath, { create: true, strict: true })
  console.log('using dbPath', dbPath)

  // Enable WAL mode for better concurrency/performance
  db.run('PRAGMA journal_mode = WAL;')
  // db.run("PRAGMA synchronous = NORMAL;")

  db.run(`
    CREATE TABLE IF NOT EXISTS translations (
      language_from TEXT NOT NULL,
      language_to TEXT NOT NULL,
      original TEXT NOT NULL,
      translation TEXT NOT NULL,
      PRIMARY KEY (language_from, language_to, original)
    )
  `)

  return db as DbConnection
}

export const db__getArrayOfTranslations = (
  db: DbConnection,
  {
    languageFrom,
    languageTo,
    strs,
  }: {
    readonly languageFrom: LanguageCode
    readonly languageTo: LanguageCode
    readonly strs: NonEmptySet<NonEmptyStringTrimmed>
  },
): Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed> => {
  function isRow(r: unknown): r is { original: string; translation: string } {
    return (
      typeof r === 'object' &&
      r !== null &&
      typeof (r as any).original === 'string' &&
      typeof (r as any).translation === 'string'
    )
  }

  const VARS_PER_SELECT_STATIC = 2 // language_from, language_to
  // Calculate safe chunk size: Total Limit - Static Params (from, to)
  // 1. We MUST chunk here because "WHERE IN (?,?,?)" is a single statement.
  // We subtract 2 because languageFrom/To take up 2 variable slots.
  const selectChunkSize = SQL_MAX_VARS - VARS_PER_SELECT_STATIC

  const results: readonly (readonly [NonEmptyStringTrimmed, NonEmptyStringTrimmed])[] = forEachChunked(
    Array.from(strs),
    selectChunkSize,
    chunk => {
      const placeholders = chunk.map(() => '?').join(',')
      const query = db.query(`
          SELECT original, translation
          FROM translations
          WHERE language_from = ?
          AND language_to = ?
          AND original IN (${placeholders})
      `)
      const rows = query.all(languageFrom, languageTo, ...chunk)

      if (!Array.isArray(rows)) throw new Error('Expected array of rows')

      return rows.map(r => {
        if (!isRow(r)) throw new Error('Expected row')
        return [nonEmptyString_afterTrim(r.original), nonEmptyString_afterTrim(r.translation)] as const
      })
    },
  )

  return Map_mkOrThrowIfDuplicateKeys(results)
}

export const db__upsertArrayOfTranslations = (
  db: DbConnection,
  {
    languageFrom,
    languageTo,
    translations,
  }: {
    readonly languageFrom: LanguageCode
    readonly languageTo: LanguageCode
    readonly translations: NonEmptyMap<NonEmptyStringTrimmed, NonEmptyStringTrimmed>
  },
): void => {
  // 1. Prepare the statement ONCE.
  // This statement only has 4 variables, so we never hit the 32k limit.
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO translations (language_from, language_to, original, translation)
    VALUES ($from, $to, $orig, $trans)
  `)

  // 2. Wrap execution in a transaction.
  // This makes it significantly faster than creating one giant "VALUES (...), (...)" string.
  const insertMany = db.transaction((items: NonEmptyMap<NonEmptyStringTrimmed, NonEmptyStringTrimmed>) => {
    for (const [original, translation] of items) {
      insertStmt.run({
        from: languageFrom,
        to: languageTo,
        orig: original,
        trans: translation,
      })
    }
  })

  // 3. Execute
  insertMany(translations)
}

export const db__upsertTranslation = (
  db: DbConnection,
  {
    languageFrom,
    languageTo,
    original,
    translation,
  }: {
    readonly languageFrom: LanguageCode
    readonly languageTo: LanguageCode
    readonly original: NonEmptyStringTrimmed
    readonly translation: NonEmptyStringTrimmed
  },
): void => {
  db.run(
    `
    INSERT OR REPLACE INTO translations (language_from, language_to, original, translation)
    VALUES (?, ?, ?, ?)
  `,
    [languageFrom, languageTo, original, translation],
  )
}
