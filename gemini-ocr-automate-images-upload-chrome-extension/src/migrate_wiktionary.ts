import { Database } from 'bun:sqlite'
import * as path from 'path'
import { HtmlValidate, type ConfigData } from 'html-validate'
import { getDbPath } from './utils/wiktionary-cache-db.js'
import { WiktionaryCleaner } from './utils/wiktionary-cleaner.js'
import { ReportStreamer } from './utils/report-streamer.js'

// --- 1. CONFIGURATION ---

const CONFIG = {
  MODE: 'ru' as 'en' | 'ru',
  // MODE: 'en' as 'en' | 'ru',
  WRITE_TO_DB: true,
  GENERATE_REPORT: false,
  VALIDATE_HTML: true,
  STOP_ON_ERROR: true,
  IF_INVALID_HTML_THROW: true,
  CHUNK_SIZE: 500, // for en better 200
}

const DICT_DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'
const CACHE_DB_PATH = getDbPath(CONFIG.MODE)
const REPORT_FILE_PATH = `wiktionary_report_${CONFIG.MODE}.html`
const TARGET_COLUMN = CONFIG.MODE === 'en' ? 'Wiktionary' : 'from_russian_wiki'

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
    deprecated: ['error', { exclude: ['big'] }],
    'missing-doctype': 'off',
    'doctype-style': 'error',
    'no-implicit-close': 'error',
  },
  elements: ['html5', { pv: { flow: true, phrasing: true } }],
}
const htmlValidator = new HtmlValidate(validatorConfig)

// --- 2. HELPERS ---

async function processEntry(
  word: string,
  originalHtml: string,
  cleaner: WiktionaryCleaner,
): Promise<{ status: string; cleaned: string; error?: string }> {
  const cleanedHtml = cleaner.clean(originalHtml)

  if (!cleanedHtml) return { status: 'SKIP: EMPTY', cleaned: '' }
  if (cleanedHtml === word) return { status: 'SKIP: EQUALS WORD', cleaned: '' }
  if (cleanedHtml.includes('  ') || cleanedHtml.includes('\t')) return { status: 'SKIP: WHITESPACE ERR', cleaned: '' }

  if (CONFIG.VALIDATE_HTML) {
    const report = await htmlValidator.validateString(cleanedHtml)
    if (!report.valid) {
      const msg = report.results[0]?.messages[0]?.message || 'Unknown'
      const consolemsg = `${msg}\n\n${originalHtml}\n\n${cleanedHtml}`
      if (CONFIG.IF_INVALID_HTML_THROW) {
        throw new Error(consolemsg)
      } else {
        console.error(consolemsg)
      }
      return { status: 'SKIP: INVALID HTML', cleaned: '', error: msg }
    }
  }

  return { status: 'VALID', cleaned: cleanedHtml }
}

// --- 3. MAIN MIGRATION LOGIC ---

const migrate = async () => {
  console.log(`🏁 Starting Migration [Mode: ${CONFIG.MODE}]`)
  console.log(`📦 Chunk Size: ${CONFIG.CHUNK_SIZE}`)
  console.log(`📝 Write to DB: ${CONFIG.WRITE_TO_DB}`)

  const dictDb = new Database(DICT_DB_PATH)
  const cacheDb = new Database(CACHE_DB_PATH)

  // Optimization for faster writing
  if (CONFIG.WRITE_TO_DB) {
    dictDb.run('PRAGMA journal_mode = WAL;')
    dictDb.run('PRAGMA synchronous = NORMAL;')
  }

  let cleaner = new WiktionaryCleaner()

  // Use Generic React-based Reporter
  const report = CONFIG.GENERATE_REPORT
    ? new ReportStreamer(REPORT_FILE_PATH, {
        title: `Wiktionary Report (${CONFIG.MODE})`,
        columns: [
          { header: 'Word', accessor: 'w', width: '150px' },
          { header: 'Status', accessor: 's', width: '120px', type: 'status' },
          { header: 'Before (HTML)', accessor: 'b', type: 'html' },
          { header: 'After (HTML)', accessor: 'a', type: 'html' },
        ],
      })
    : null

  let upsertStmt: any = null
  if (CONFIG.WRITE_TO_DB) {
    const cols = dictDb.query('PRAGMA table_info(km_Dict)').all() as { name: string }[]
    if (!cols.some(c => c.name === TARGET_COLUMN)) {
      console.log(`➕ Adding column '${TARGET_COLUMN}'...`)
      dictDb.run(`ALTER TABLE km_Dict ADD COLUMN ${TARGET_COLUMN} TEXT`)
    }

    // CHANGED: Use UPSERT (INSERT ... ON CONFLICT DO UPDATE)
    // This assumes 'Word' is the PRIMARY KEY or has a UNIQUE constraint in km_Dict
    upsertStmt = dictDb.prepare(`
      INSERT INTO km_Dict (Word, ${TARGET_COLUMN})
      VALUES ($word, $html)
      ON CONFLICT(Word) DO UPDATE SET ${TARGET_COLUMN} = excluded.${TARGET_COLUMN}
    `)
  }

  try {
    const { count } = cacheDb.query('SELECT count(*) as count FROM wiktionary_entries WHERE status = 200').get() as {
      count: number
    }
    console.log(`📊 Total rows: ${count}`)

    let offset = 0
    let processedTotal = 0

    // Using Pagination Loop (Limit/Offset) to prevent memory leaks
    while (processedTotal < count) {
      // 1. Fetch Chunk (Read)
      const chunk = cacheDb
        .query(
          `SELECT word, html FROM wiktionary_entries WHERE status = 200 LIMIT ${CONFIG.CHUNK_SIZE} OFFSET ${offset}`,
        )
        .all() as { word: string; html: string }[]

      if (chunk.length === 0) break

      const validBatch: { word: string; html: string }[] = []

      // 2. Process Chunk (CPU)
      for (const item of chunk) {
        const result = await processEntry(item.word, item.html, cleaner)

        // Handle Reporting
        if (report) {
          report.writeRow({
            w: item.word,
            s: result.status === 'VALID' ? (CONFIG.WRITE_TO_DB ? 'UPDATED' : 'VALID') : result.status,
            b: item.html,
            a: result.cleaned,
          })
        }

        // Handle Errors/Stop
        if (result.status.startsWith('ERROR') || result.status.startsWith('FATAL')) {
          if (CONFIG.STOP_ON_ERROR) throw new Error(`Stop on error (${item.word}): ${result.error}`)
        }

        // Add to write batch
        if (result.status === 'VALID') {
          validBatch.push({ word: item.word, html: result.cleaned })
        }
      }

      // 3. Write Chunk (IO)
      if (CONFIG.WRITE_TO_DB && validBatch.length > 0 && upsertStmt) {
        const transaction = dictDb.transaction(rows => {
          for (const row of rows) upsertStmt.run({ $html: row.html, $word: row.word })
        })
        transaction(validBatch)
      }

      offset += chunk.length
      processedTotal += chunk.length
      process.stdout.write(`\r🚀 Processed: ${processedTotal}/${count}`)

      // 4. Cleanup Memory (Critical)
      // cleaner.free()
      // cleaner = new WiktionaryCleaner()
      if (typeof Bun !== 'undefined') {
        Bun.gc(true)
        await Bun.sleep(5) // Allow Event Loop to catch up
      }
    }

    console.log('\n')
    if (CONFIG.WRITE_TO_DB) {
      console.log('🧹 Vacuuming DB...')
      dictDb.run('VACUUM;')
    }
  } catch (e: any) {
    console.error('\n❌ ERROR:', e.message)
  } finally {
    if (cleaner) cleaner.free()
    if (report) report.close()
    dictDb.close()
    cacheDb.close()
    if (CONFIG.GENERATE_REPORT) console.log(`📄 Report: ${path.resolve(REPORT_FILE_PATH)}`)
  }
}

migrate()
