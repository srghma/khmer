#!/usr/bin/env bun
import { WiktionaryCache_create, type WiktionaryCache } from './utils/wiktionary-cache-db.js'
import { EnglishKhmerCache_create, type EnglishKhmerCache } from './utils/english-khmer-en-kh-cache-db.js'
import { EnglishKhmerKhEnCache_create, type EnglishKhmerKhEnCache } from './utils/english-khmer-kh-en-cache-db.js'
import { processEKKhEnQueue } from './utils/english-khmer-kh-en-fetch.js'
import { iterateKhmerWords } from './utils/khmer-word.js'
import { runFetchCycle } from './utils/run-fetch-cycle.js'

const DICT_DB_PATH = '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db'

export const run_fetch_khmer_english_definitions = async (
  ekKhEnCache: EnglishKhmerKhEnCache,
  wiktionaryCache: WiktionaryCache<'en'>,
  enKmCache: EnglishKhmerCache,
) => {
  const query = `
      SELECT Word FROM km_Dict
      WHERE (
        Desc IS NOT NULL
        OR Wiktionary IS NULL
        OR from_csv_variants IS NULL
        )
        AND from_csv_nounForms IS NULL
        AND from_csv_pronunciations IS NULL
        AND from_csv_rawHtml IS NULL
        AND from_chuon_nath IS NULL
        AND from_chuon_nath_translated IS NULL
        AND from_russian_wiki IS NULL
  `

  await runFetchCycle({
    name: 'Kh->En Defs',
    dictDbPath: DICT_DB_PATH,
    dbQuery: query,
    targetCache: ekKhEnCache,
    sourceCaches: [ekKhEnCache, wiktionaryCache, enKmCache],
    strToIterator: iterateKhmerWords,
    processQueue: processEKKhEnQueue,
  })
}

// Standalone execution support
if (import.meta.main) {
  const ekKhEnCache = await EnglishKhmerKhEnCache_create({ readonly: false })
  const wiktionaryCache = await WiktionaryCache_create('en', { readonly: true })
  const enKmCache = await EnglishKhmerCache_create({ readonly: true })
  run_fetch_khmer_english_definitions(ekKhEnCache, wiktionaryCache, enKmCache)
}
