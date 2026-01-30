#!/usr/bin/env bun
import { EnglishKhmerCache_create, type EnglishKhmerCache } from './utils/english-khmer-en-kh-cache-db.js'
import { WiktionaryCache_create, type WiktionaryCache } from './utils/wiktionary-cache-db.js'
import { EnglishKhmerKhEnCache_create, type EnglishKhmerKhEnCache } from './utils/english-khmer-kh-en-cache-db.js'
import { processEKQueue } from './utils/english-khmer-en-kh-fetch.js'
import { iterateLowercaseLatinWords } from './utils/string-lowercase-latin.js'
import { runFetchCycle } from './utils/run-fetch-cycle.js'

const DICT_DB_PATH = '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db'

export const run_fetch_english_khmer_definitions = async (
  ekCache: EnglishKhmerCache,
  wiktionaryCache: WiktionaryCache<'en'>,
  ekKhEnCache: EnglishKhmerKhEnCache,
) => {
  const query = `
    SELECT Word FROM en_Dict
    WHERE Desc_en_only IS NOT NULL OR Desc IS NOT NULL
  `

  await runFetchCycle({
    name: 'En->Km Defs',
    dictDbPath: DICT_DB_PATH,
    dbQuery: query,
    targetCache: ekCache,
    sourceCaches: [ekCache, ekKhEnCache, wiktionaryCache],
    strToIterator: iterateLowercaseLatinWords,
    processQueue: processEKQueue,
  })
}

if (import.meta.main) {
  const ekCache = await EnglishKhmerCache_create({ readonly: false })
  const wiktionaryCache = await WiktionaryCache_create('en', { readonly: true })
  const ekKhEnCache = await EnglishKhmerKhEnCache_create({ readonly: true })
  run_fetch_english_khmer_definitions(ekCache, wiktionaryCache, ekKhEnCache)
}
