// import * as translator from "open-google-translator"
// import { Database, open } from "sqlite"
// import * as sqlite3 from "sqlite3"
// "@types/sqlite3": "^3.1.11",
// "sqlite": "^5.1.1",
// "sqlite3": "^5.1.7",

import { Database } from "bun:sqlite"
import * as fs from "fs"
import * as path from "path"
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from "./non-empty-string-trimmed"
import { type NonEmptySet } from "./non-empty-set"
import { Map_mkOrThrowIfDuplicateKeys, Map_union_onCollisionThrow } from "./map"
import { Set_diff } from "./sets"
import {
  Map_assertNonEmptyMap,
  Map_toNonEmptyMap_orThrow,
  type NonEmptyMap,
} from "./non-empty-map"
import { forEachChunked } from "./async"
// import { translateBulk, type LanguageCode } from "./google-translate"
import { translateBulk, type LanguageCode } from "./google-translate-puppeteer"
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
    __brand: "TranslationsDb"
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
  console.log("using dbPath", dbPath)

  // Enable WAL mode for better concurrency/performance
  db.run("PRAGMA journal_mode = WAL;")
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
      typeof r === "object" &&
      r !== null &&
      typeof (r as any).original === "string" &&
      typeof (r as any).translation === "string"
    )
  }

  const VARS_PER_SELECT_STATIC = 2 // language_from, language_to
  // Calculate safe chunk size: Total Limit - Static Params (from, to)
  // 1. We MUST chunk here because "WHERE IN (?,?,?)" is a single statement.
  // We subtract 2 because languageFrom/To take up 2 variable slots.
  const selectChunkSize = SQL_MAX_VARS - VARS_PER_SELECT_STATIC

  const results: (readonly [NonEmptyStringTrimmed, NonEmptyStringTrimmed])[] =
    forEachChunked(Array.from(strs), selectChunkSize, (chunk) => {
      const placeholders = chunk.map(() => "?").join(",")
      const query = db.query(`
          SELECT original, translation
          FROM translations
          WHERE language_from = ?
          AND language_to = ?
          AND original IN (${placeholders})
      `)
      const rows = query.all(languageFrom, languageTo, ...chunk)

      if (!Array.isArray(rows)) throw new Error("Expected array of rows")

      return rows.map((r) => {
        if (!isRow(r)) throw new Error("Expected row")
        return [
          nonEmptyString_afterTrim(r.original),
          nonEmptyString_afterTrim(r.translation),
        ] as const
      })
    })

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
    readonly translations: NonEmptyMap<
      NonEmptyStringTrimmed,
      NonEmptyStringTrimmed
    >
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
  const insertMany = db.transaction(
    (items: NonEmptyMap<NonEmptyStringTrimmed, NonEmptyStringTrimmed>) => {
      for (const [original, translation] of items) {
        insertStmt.run({
          from: languageFrom,
          to: languageTo,
          orig: original,
          trans: translation,
        })
      }
    },
  )

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

// --- Main Translation Logic ---

export const translateSrt = async (
  db: DbConnection,
  {
    strs,
    languageFrom,
    languageTo,
  }: {
    readonly strs: NonEmptySet<NonEmptyStringTrimmed>
    readonly languageFrom: LanguageCode
    readonly languageTo: LanguageCode
  },
): Promise<NonEmptyMap<NonEmptyStringTrimmed, NonEmptyStringTrimmed>> => {
  // 2. Fetch Cached Translations
  const cachedTranslations: Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed> =
    db__getArrayOfTranslations(db, {
      languageFrom,
      languageTo,
      strs,
    })

  // 3. Determine Missing
  const missingOriginals: Set<NonEmptyStringTrimmed> = Set_diff(
    strs,
    new Set(cachedTranslations.keys()),
  )

  if (missingOriginals.size <= 0)
    return Map_toNonEmptyMap_orThrow(cachedTranslations)

  // 4. Translate Missing (and update DB incrementally)
  const apiResultRaw = await translateBulk({
    listOfWordsToTranslate: Array.from(missingOriginals),
    fromLanguage: languageFrom,
    toLanguage: languageTo,
    onSuccess: (original, translation) => {
      // Upsert immediately after each successful translation
      db__upsertTranslation(db, {
        languageFrom,
        languageTo,
        original,
        translation,
      })
    },
  })
  console.log("apiResultRaw", apiResultRaw)

  // Validate API response
  const apiResultTranslations = Map_mkOrThrowIfDuplicateKeys(
    apiResultRaw.map((item: { original: string; translation: string }) => {
      return [
        nonEmptyString_afterTrim(item.original),
        nonEmptyString_afterTrim(item.translation),
      ]
    }),
  )

  // Sanity Check
  if (apiResultTranslations.size !== missingOriginals.size)
    throw new Error(
      `[Warning] apiResultTranslations.size ${apiResultTranslations.size} !== missingOriginals.size ${missingOriginals.size}`,
    )

  // Note: We no longer perform a bulk upsert here because we upserted incrementally.

  // 5. Return Merged Map
  // Even if partial results occurred (due to abort), apiResultTranslations contains what finished.
  // We return whatever we have.
  const allTranslations = Map_union_onCollisionThrow(
    cachedTranslations,
    apiResultTranslations,
  )

  // If we had missing items but got empty results (e.g. immediate abort), we might
  // fail Map_assertNonEmptyMap if cached was also empty. But the return type demands NonEmptyMap.
  // If the input 'strs' was non-empty, and we found everything in cache, we returned early.
  // If we had missing, and got nothing back, and cache was empty, we can't return a NonEmptyMap of results covering 'strs'.
  // However, the function signature assumes we succeed or throw.
  // For the purpose of this refactor, we attempt to cast or throw.
  Map_assertNonEmptyMap(allTranslations)

  return Map_toNonEmptyMap_orThrow(allTranslations)
}
