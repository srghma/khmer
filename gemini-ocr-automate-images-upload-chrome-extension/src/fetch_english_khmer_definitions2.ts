#!/usr/bin/env bun
import { EnglishKhmerCache_create, type EnglishKhmerCache } from './utils/english-khmer-en-kh-cache-db.js'
import { processEKQueue } from './utils/english-khmer-en-kh-fetch.js'
import { iterateLowercaseLatinWords } from './utils/string-lowercase-latin.js'
import { runFetchCycle } from './utils/run-fetch-cycle.js'

// The path requested
const DICT_DB_PATH = '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db'

export const run_fetch_en_km_com_recursive = async (
  ekCache: EnglishKhmerCache,
  // wiktionaryCache: WiktionaryCache<'en'>,
  // ekKhEnCache: EnglishKhmerKhEnCache,
) => {
  // We select words that already have a definition in en_km_com.
  // runFetchCycle uses this list to know what is "Done" (so we don't fetch them again).
  // Then it looks inside the HTML of the caches (sourceCaches) to find NEW words
  // that are NOT in this list, and fetches them.
  const query = `
    SELECT Word
    FROM "en_Dict"
    WHERE "en_km_com" IS NOT NULL
  `

  await runFetchCycle({
    name: 'EnglishKhmer.com Recursive',
    dictDbPath: DICT_DB_PATH,
    dbQuery: query,
    // The target cache where new results are saved
    targetCache: ekCache, // TODO: new
    // The sources to scan for new words (links/text inside HTML)
    // We include ekCache here so it scans the HTML of words we already fetched
    sourceCaches: [
      // ekCache,
      // ekKhEnCache,
      // wiktionaryCache
    ],
    // The regex iterator to find english words in the HTML
    strToIterator: iterateLowercaseLatinWords,
    // The specific fetcher logic for english-khmer.com
    processQueue: processEKQueue,
  })
}

if (import.meta.main) {
  // Initialize caches
  const ekCache = await EnglishKhmerCache_create({ readonly: false })
  // const wiktionaryCache = await WiktionaryCache_create('en', { readonly: true })
  // const ekKhEnCache = await EnglishKhmerKhEnCache_create({ readonly: true })

  await run_fetch_en_km_com_recursive(
    ekCache,
    // wiktionaryCache,
    // ekKhEnCache
  )
}
