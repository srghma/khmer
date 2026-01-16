import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import jsonlines from 'jsonlines'
import {
  unknown_assertNonEmptyString,
  unknown_isNonEmptyString,
  type NonEmptyString,
} from './utils/non-empty-string.js'

// -- Type Definitions --

export interface CacheEntrySuccess {
  readonly word: NonEmptyString
  readonly html: NonEmptyString
}

export interface CacheEntry404 {
  readonly word: NonEmptyString
  readonly status: 404
}

export type CacheEntry = CacheEntrySuccess | CacheEntry404

// -- Validation Helpers --

function isCacheEntry_fromUnknown(v: unknown): v is CacheEntry {
  if (typeof v !== 'object' || v === null) return false
  const candidate = v as Record<string, unknown>
  // Must have a word
  if (!('word' in candidate) || !unknown_isNonEmptyString(candidate.word)) return false
  // Check if it's a 404 entry
  if ('status' in candidate && candidate.status === 404) return true
  // Otherwise, must be a success entry with HTML
  if ('html' in candidate && unknown_isNonEmptyString(candidate.html)) return true
  return false
}

function assertIsCacheEntry_fromUnknown(v: unknown): asserts v is CacheEntry {
  if (!isCacheEntry_fromUnknown(v)) throw new TypeError(`Invalid CacheEntry shape. Received: ${JSON.stringify(v)}`)
}

// -- Cache Interface --

export interface CacheGetOuput_Success {
  readonly t: 'success'
  readonly html: NonEmptyString
}

export interface CacheGetOuput_404 {
  readonly t: '404'
}

export type CacheGetOuput = CacheGetOuput_Success | CacheGetOuput_404

export interface WiktionaryCache {
  /** Checks if the word is in the cache (either success or 404) */
  readonly has: (word: NonEmptyString) => boolean

  /**
   * Returns the cached entry.
   * - If success: returns object with html
   * - If 404: returns object with status: 404
   * - If missing: returns undefined
   */
  readonly get: (word: NonEmptyString) => CacheGetOuput | undefined

  /** Adds a successful HTML fetch to the cache */
  readonly addSuccess: (word: NonEmptyString, html: NonEmptyString) => Promise<void>

  /** Adds a 404 result to the cache */
  readonly add404: (word: NonEmptyString) => Promise<void>
}

// -- IO Actions --

const ensureCacheFileExists = async (CACHE_FILE: NonEmptyString): Promise<void> => {
  try {
    await fsPromises.access(CACHE_FILE)
  } catch {
    await fsPromises.writeFile(CACHE_FILE, '', 'utf8')
  }
}

const readCacheEntries = (CACHE_FILE: NonEmptyString): Promise<Map<NonEmptyString, CacheEntry>> => {
  return new Promise((resolve, reject) => {
    const map = new Map<NonEmptyString, CacheEntry>()
    const stream = fs.createReadStream(CACHE_FILE)
    const parser = jsonlines.parse()

    stream.pipe(parser)

    parser.on('data', (data: unknown) => {
      try {
        assertIsCacheEntry_fromUnknown(data)
        map.set(data.word, data)
      } catch (err) {
        // Log bad lines but don't crash the whole load?
        console.warn(`[Cache Warning] Skipping invalid line: ${err}`)
      }
    })

    parser.on('end', () => resolve(map))
    parser.on('error', err => reject(err))
    stream.on('error', err => reject(err))
  })
}

const appendToCacheFile = async (CACHE_FILE: NonEmptyString, entry: CacheEntry): Promise<void> => {
  const stringifier = jsonlines.stringify()
  const linePromise = new Promise<unknown>(resolve => {
    stringifier.on('data', (line: unknown) => resolve(line))
  })

  stringifier.write(entry)
  stringifier.end()

  const line = await linePromise
  unknown_assertNonEmptyString(line)
  await fsPromises.appendFile(CACHE_FILE, line, 'utf8')
}

// -- Constructor --

export const WiktionaryCache_create = async (CACHE_FILE: NonEmptyString): Promise<WiktionaryCache> => {
  await ensureCacheFileExists(CACHE_FILE)

  // Load state into memory
  const internalMap = await readCacheEntries(CACHE_FILE)

  return {
    has: word => internalMap.has(word),
    get: word => {
      const entry = internalMap.get(word)
      if (!entry) return undefined
      if ('status' in entry && entry.status === 404) return { t: '404' }
      if (!('html' in entry)) throw new Error(`Cache entry for ${word} is missing html field`)
      return { t: 'success', html: entry.html }
    },
    addSuccess: async (word, html) => {
      const entry: CacheEntrySuccess = { word, html }
      internalMap.set(word, entry)
      await appendToCacheFile(CACHE_FILE, entry)
    },
    add404: async word => {
      const entry: CacheEntry404 = { word, status: 404 }
      internalMap.set(word, entry)
      await appendToCacheFile(CACHE_FILE, entry)
    },
  }
}
