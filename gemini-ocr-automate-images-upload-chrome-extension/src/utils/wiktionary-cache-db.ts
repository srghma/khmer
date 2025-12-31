import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import * as path from 'path'
import { type NonEmptyString, unknown_isNonEmptyString } from './non-empty-string'

// -- Type Definitions (Mirrored from original) --

export interface CacheEntrySuccess {
  readonly word: NonEmptyString
  readonly html: NonEmptyString
}

export interface CacheEntry404 {
  readonly word: NonEmptyString
  readonly status: 404
}

export type CacheEntry = CacheEntrySuccess | CacheEntry404

export interface CacheGetOuput_Success {
  readonly t: 'success'
  readonly html: NonEmptyString
}

export interface CacheGetOuput_404 {
  readonly t: '404'
}

export type CacheGetOuput = CacheGetOuput_Success | CacheGetOuput_404

export interface WiktionaryCache {
  readonly has: (word: NonEmptyString) => boolean
  readonly get: (word: NonEmptyString) => CacheGetOuput | undefined
  readonly addSuccess: (word: NonEmptyString, html: NonEmptyString) => Promise<void>
  readonly add404: (word: NonEmptyString) => Promise<void>
}

// -- Database Setup --

type DbConnection = Database

const getDbPath = (): string => {
  const baseDir = process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`
  return path.join(baseDir, 'my-translate-srt-files-cache.sqlite')
}

const ensureDb = (): DbConnection => {
  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const db = new Database(dbPath, { create: true })

  // Enable WAL for performance
  db.run('PRAGMA journal_mode = WAL;')

  // Create table: word (PK), status (200 or 404), html (text, nullable)
  db.run(`
    CREATE TABLE IF NOT EXISTS wiktionary_entries (
      word TEXT PRIMARY KEY,
      status INTEGER NOT NULL,
      html TEXT
    )
  `)

  return db
}

// -- Implementation --

export const WiktionaryCache_create = async (): Promise<WiktionaryCache> => {
  const db = ensureDb()

  // Pre-prepare statements for performance
  const stmtHas = db.prepare('SELECT 1 FROM wiktionary_entries WHERE word = ?')
  const stmtGet = db.prepare('SELECT status, html FROM wiktionary_entries WHERE word = ?')
  const stmtInsert = db.prepare(`
    INSERT OR REPLACE INTO wiktionary_entries (word, status, html)
    VALUES ($word, $status, $html)
  `)

  return {
    has: word => {
      return stmtHas.get(word) !== null
    },

    get: word => {
      const row = stmtGet.get(word) as { status: number; html: string | null } | undefined

      if (!row) return undefined

      if (row.status === 404) {
        return { t: '404' }
      }

      if (row.status === 200 && row.html && unknown_isNonEmptyString(row.html)) {
        return { t: 'success', html: row.html }
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
  }
}
