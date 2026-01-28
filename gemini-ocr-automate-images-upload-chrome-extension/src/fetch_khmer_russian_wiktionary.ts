#!/usr/bin/env bun
import { WiktionaryCache_create, type WiktionaryCache } from './utils/wiktionary-cache-db.js'
import { EnglishKhmerCache_create, type EnglishKhmerCache } from './utils/english-khmer-en-kh-cache-db.js'
import { EnglishKhmerKhEnCache_create, type EnglishKhmerKhEnCache } from './utils/english-khmer-kh-en-cache-db.js'
import { processQueue } from './utils/wiktionary-fetch.js'
import { iterateKhmerWordsFromTextPlusNormalizedEtc } from './utils/khmer-word.js'
import { runFetchCycle } from './utils/run-fetch-cycle.js'

const DICT_DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'

export const run_fetch_khmer_russian_wiktionary = async (
  wiktionaryCacheRu: WiktionaryCache<'ru'>,
  enKmCache: EnglishKhmerCache,
  ekKhEnCache: EnglishKhmerKhEnCache,
) => {
  const query = `
      SELECT Word FROM km_Dict
      WHERE (
        Wiktionary IS NOT NULL
        OR from_csv_variants IS NOT NULL
        OR from_csv_nounForms IS NOT NULL
        OR from_csv_pronunciations IS NOT NULL
        OR from_csv_rawHtml IS NOT NULL
        OR from_chuon_nath IS NOT NULL
        OR from_chuon_nath_translated IS NOT NULL
        )
        AND from_russian_wiki IS NULL
  `

  await runFetchCycle({
    name: 'Wiktionary (Ru)',
    dictDbPath: DICT_DB_PATH,
    dbQuery: query,
    targetCache: wiktionaryCacheRu,
    sourceCaches: [ekKhEnCache, enKmCache, wiktionaryCacheRu],
    strToIterator: iterateKhmerWordsFromTextPlusNormalizedEtc,
    processQueue: (words, cache) => processQueue(words, 'ru', cache),
  })
}

if (import.meta.main) {
  const wiktionaryCacheRu = await WiktionaryCache_create('ru', { readonly: false })
  const enKmCache = await EnglishKhmerCache_create({ readonly: true })
  const ekKhEnCache = await EnglishKhmerKhEnCache_create({ readonly: true })
  run_fetch_khmer_russian_wiktionary(wiktionaryCacheRu, enKmCache, ekKhEnCache)
}
