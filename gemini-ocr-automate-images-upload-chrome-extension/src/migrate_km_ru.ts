import { Database } from 'bun:sqlite'
import {
  parseDictionaryFile,
  mkGrouped,
  markdownToHtml,
  type GroupedEntry,
  type ParsedPage,
  validateUniqueHeadwords,
} from './mk_continues_pages'
import {
  type TypedKhmerWordDictionaryIndexElement,
  strToKhmerWordDictionaryIndexOrUndefined,
} from './utils/khmer-word-dictionary-index'
import { type NonEmptyArray } from './utils/non-empty-array'
import { assertIsDefinedAndReturn } from './utils/asserts'

// --- Configuration ---

const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  KM_RU_DICT_PATH: '/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.txt',
  /**
   * The database column name where the Russian definitions will be stored.
   */
  COLUMN_NAME: 'gorgoniev',
  /**
   * If true, sets the configured column to NULL for all rows before starting the migration.
   */
  CLEAN_COLUMN_BEFORE_START: true,
  /**
   * If true, only Khmer words already present in km_Dict will be updated.
   * New Khmer words found in the Russian dictionary will NOT be added as new rows.
   */
  ONLY_UPDATE_EXISTING: true,
}

// --- Helpers ---

const sanitizeForStrictSql = (s: string): string =>
  s
    .trim()
    .replace(/\t/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/ {2,}/g, ' ')

function prepareHtml(g: GroupedEntry<string>): string {
  // Single definition → return directly
  if (g.allContent.length === 1) {
    const h = markdownToHtml(assertIsDefinedAndReturn(g.allContent[0]))
    return sanitizeForStrictSql(h.replace(/<br>/g, '___BR___')).replace(/___BR___/g, '<br>')
  }

  // Multiple definitions → use <ol><li>
  const items = g.allContent.map(c => {
    const h = markdownToHtml(c)
    return `<li>${h}</li>`
  })

  const html = `<ol>
${items.join('\n')}
</ol>`

  return sanitizeForStrictSql(html.replace(/<br>/g, '___BR___')).replace(/___BR___/g, '<br>')
}

async function main() {
  const db = new Database(CONFIG.DB_PATH)

  // 1. Ensure column exists
  const info = db.query('PRAGMA table_info(km_Dict)').all() as {
    name: string
  }[]

  if (!info.some(c => c.name === CONFIG.COLUMN_NAME)) {
    throw new Error(`The column "${CONFIG.COLUMN_NAME}" does not exist in the table "km_Dict". Please add it first.`)
  }

  // 2. Optional: Clean existing data
  if (CONFIG.CLEAN_COLUMN_BEFORE_START) {
    console.log(`🧹 Cleaning all values in column "${CONFIG.COLUMN_NAME}"...`)
    db.run(`UPDATE km_Dict SET ${CONFIG.COLUMN_NAME} = NULL`)
  }

  // 3. Parse and Group the Russian dictionary content
  const dict: NonEmptyArray<ParsedPage<TypedKhmerWordDictionaryIndexElement>> =
    parseDictionaryFile<TypedKhmerWordDictionaryIndexElement>(
      CONFIG.KM_RU_DICT_PATH,
      strToKhmerWordDictionaryIndexOrUndefined,
    )

  validateUniqueHeadwords(dict)

  const grouped = mkGrouped(dict)

  // 4. Prepare the Query
  const query = CONFIG.ONLY_UPDATE_EXISTING
    ? `UPDATE km_Dict SET ${CONFIG.COLUMN_NAME} = $desc WHERE Word = $word`
    : `INSERT INTO km_Dict (Word, ${CONFIG.COLUMN_NAME}) VALUES ($word, $desc) ON CONFLICT(Word) DO UPDATE SET ${CONFIG.COLUMN_NAME} = excluded.${CONFIG.COLUMN_NAME}`

  const stmt = db.prepare(query)

  // 5. Execute Migration
  console.log(
    `🚀 Starting migration into column "${CONFIG.COLUMN_NAME}" (${CONFIG.ONLY_UPDATE_EXISTING ? 'Update only' : 'Upsert'})...`,
  )

  let processedCount = 0
  let affectedCount = 0

  db.transaction(() => {
    for (const entry of grouped) {
      const info = stmt.run({
        $word: sanitizeForStrictSql(entry.headword),
        $desc: prepareHtml(entry),
      })

      processedCount++
      affectedCount += info.changes
    }
  })()

  console.log(`\n✨ Finished:`)
  console.log(`   Processed entries in source: ${processedCount}`)
  console.log(`   Rows updated in database:    ${affectedCount}`)

  if (CONFIG.ONLY_UPDATE_EXISTING) {
    console.log(`   Entries skipped (not in DB): ${processedCount - affectedCount}`)
  }

  console.log('🧹 Optimizing database...')
  db.run('VACUUM;')
  db.close()
}

main().catch(console.error)

// ✨ Finished:
//    Processed entries in source: 13287
//    Rows updated in database:    8755
//    Entries skipped (not in DB): 4532
