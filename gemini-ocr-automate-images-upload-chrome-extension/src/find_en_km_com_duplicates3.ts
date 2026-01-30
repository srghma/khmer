import { Database } from 'bun:sqlite'
import { Window } from 'happy-dom'
import { HtmlValidate, type ConfigData } from 'html-validate'
import * as path from 'path'
import * as crypto from 'crypto'
import fs from 'node:fs'
import PQueue from 'p-queue'

import { type NonEmptyStringTrimmed, nonEmptyString_afterTrim } from './utils/non-empty-string-trimmed.js'
import { type Except, Except_error, Except_isError, Except_ok } from './utils/types.js'
import { cleanEnglishKhmerHtml } from './utils/english-khmer-en-kh-extractor.js'

// --- 1. CONFIGURATION ---

const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  // Regex for "Valid" content (Short numeric image names)
  // We want to find rows that DO NOT match this.
  VALID_IMG_REGEX: /\/en_Dict_en_km_com_assets_images\/\d{2,6}\.webp/,
  CONCURRENCY: 5,
  WRITE_TO_DB: true,
}

const ASSETS_DIR = '/home/srghma/projects/khmer/srghmakhmerdict/src/assets/en_Dict_en_km_com_assets_images'

// --- 2. CLEANER LOGIC (Copied from migration script) ---

const validatorConfig: ConfigData = {
  extends: [],
  rules: {
    'close-order': 'error',
    'no-dup-id': 'error',
    'no-raw-characters': 'error',
    'unrecognized-char-ref': 'error',
    'void-content': 'error',
    'void-style': 'error',
    'attr-quotes': 'error',
    'element-case': 'error',
    'attr-case': 'error',
    'attribute-empty-style': 'error',
    'no-inline-style': 'off',
    'element-permitted-content': 'off',
    'no-unknown-elements': 'error',
    deprecated: 'off',
    'missing-doctype': 'off',
    'doctype-style': 'error',
    'no-implicit-close': 'error',
  },
  elements: ['html5', { pv: { flow: true, phrasing: true } }],
}

const htmlValidator = new HtmlValidate(validatorConfig)

export type AssetHash = NonEmptyStringTrimmed & { readonly __brandAssetHash: 'AssetHash' }

interface Asset {
  hash: AssetHash
  rawBuffer: Buffer
  mime: string
  extension: string
}

// --- 3. FETCH LOGIC ---

type FetchResult = { t: 'ok'; html: NonEmptyStringTrimmed } | { t: '404' }

const fetchUrl = async (word: string): Promise<Except<string, FetchResult>> => {
  const url = `https://www.english-khmer.com/index.php?gcm=1&gword=${encodeURIComponent(word)}`

  let response = undefined
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        Referer: 'https://www.english-khmer.com/',
      },
    })
  } catch (e) {
    return Except_error(`Network Error: ${String(e)}`)
  }

  if (!response.ok) return Except_error(`HTTP ${response.status}`)

  const rawHtml = await response.text()
  const result = await cleanEnglishKhmerHtml(rawHtml)

  if (result === '404') return Except_ok({ t: '404' })
  if (!result) return Except_error('Parser failed to extract definition from page')

  return Except_ok({ t: 'ok', html: result })
}

// --- 4. MAIN SCRIPT ---

async function run() {
  console.log('🏁 Starting Repair Script for en_Dict.en_km_com')
  console.log(`📂 DB: ${CONFIG.DB_PATH}`)
  console.log(`📝 Write Enabled: ${CONFIG.WRITE_TO_DB}`)

  const db = new Database(CONFIG.DB_PATH)
  const queue = new PQueue({ concurrency: CONFIG.CONCURRENCY })

  // 1. Identify Invalid Rows
  console.log('🔍 Scanning database for invalid rows...')
  const allRows = db.query('SELECT Word, en_km_com FROM en_Dict WHERE en_km_com IS NOT NULL').all() as {
    Word: string
    en_km_com: string
  }[]

  const invalidRows = allRows.filter(row => !CONFIG.VALID_IMG_REGEX.test(row.en_km_com))

  console.log(`📊 Found ${invalidRows.length} invalid rows (out of ${allRows.length}).`)

  if (invalidRows.length === 0) {
    console.log('✨ Nothing to fix.')
    return
  }

  // 2. Process Queue
  let processed = 0
  const stats = { fixed: 0, failed: 0, notFound: 0 }
  const total = invalidRows.length

  const updateStmt = db.prepare('UPDATE en_Dict SET en_km_com = $html WHERE Word = $word')

  for (const row of invalidRows) {
    queue.add(async () => {
      const word = row.Word
      processed++
      const prefix = `[${processed}/${total}] ${word}`

      // A. Fetch
      const res = await fetchUrl(word)

      if (Except_isError(res)) {
        console.error(`  ❌ ${prefix} Fetch Failed: ${res.error}`)
        stats.failed++
        return
      }

      if (res.v.t === '404') {
        console.log(`  ⚪ ${prefix} 404 Not Found`)
        stats.notFound++
        return
      }

      // C. Validate
      const report = htmlValidator.validateStringSync(res.v.html)
      if (!report.valid) {
        const msg = report.results[0]?.messages[0]?.message || 'Unknown'
        const consolemsg = `${msg}\n\n` // ${originalHtml}\n\n${cleanedHtml}
        throw new Error(consolemsg)
        console.error(`  ❌ ${prefix} Invalid HTML generated`)
        stats.failed++
        return
      }

      // D. Update
      if (CONFIG.WRITE_TO_DB) {
        updateStmt.run({ $html: res.v.html, $word: word })
        console.log(`  ✅ ${prefix} Updated`)
      } else {
        console.log(`  🔎 ${prefix} [DRY RUN] Would update`)
      }

      stats.fixed++

      // Be nice to the server
      await new Promise(r => setTimeout(r, 200 + Math.random() * 500))
    })
  }

  await queue.onIdle()

  db.close()

  console.log('\n--- Summary ---')
  console.log(`Fixed: ${stats.fixed}`)
  console.log(`404:   ${stats.notFound}`)
  console.log(`Fail:  ${stats.failed}`)
  console.log('Done.')
}

if (import.meta.main) {
  run()
}
