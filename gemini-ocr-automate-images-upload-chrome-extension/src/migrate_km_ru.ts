import { Database } from 'bun:sqlite'
import {
  parseDictionaryFile,
  mkGrouped,
  markdownToHtml,
  type GroupedEntry,
  type ParsedPage,
  validateUniqueHeadwords,
} from '/home/srghma/projects/khmer/dicts/src/mk_continues_pages.ts'
import {
  type TypedKhmerWordDictionaryIndexElement,
  strToKhmerWordDictionaryIndexOrUndefined,
} from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/khmer-word-dictionary-index'
import { type NonEmptyArray } from './utils/non-empty-array'

// --- Configuration ---

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const KM_RU_DICT_PATH = '/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.txt'

/**
 * If true, only Khmer words already present in km_en_tbl_Dict will be updated.
 * New Khmer words found in the Russian dictionary will NOT be added as new rows.
 */
const dontINSERTNewValuesIfWordDoesNotExistInDictButOnlyAddRussianTranslationIfWordIsAlreadyInDict = true

// --- Helpers ---

const sanitizeForStrictSql = (s: string): string =>
  s
    .trim()
    .replace(/\t/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/ {2,}/g, ' ')

function prepareHtml(g: GroupedEntry<string>): string {
  const html = g.allContent
    .map((c, i) => {
      let h = markdownToHtml(c)
      return g.allContent.length > 1 ? `<div style="margin-bottom:5px;"><b>[${i + 1}]</b> ${h}</div>` : h
    })
    .join('<hr>')

  return sanitizeForStrictSql(html.replace(/<br>/g, '___BR___')).replace(/___BR___/g, '<br>')
}

async function main() {
  const db = new Database(DB_PATH)

  // 1. Ensure column exists
  const info = db.query('PRAGMA table_info(km_en_tbl_Dict)').all() as {
    name: string
  }[]

  if (!info.some(c => c.name === 'from_russian')) {
    console.log('➕ Adding column from_russian...')
    db.run(
      `ALTER TABLE km_en_tbl_Dict ADD COLUMN from_russian TEXT CHECK("from_russian" != '' AND "from_russian" != "Word" AND "from_russian" = TRIM("from_russian") AND "from_russian" NOT LIKE '%  %' AND "from_russian" NOT LIKE '%' || CHAR(9) || '%' AND "from_russian" NOT LIKE '%' || CHAR(10) || '%')`,
    )
  }

  // 2. Parse and Group the Russian dictionary content
  const dict: NonEmptyArray<ParsedPage<TypedKhmerWordDictionaryIndexElement>> =
    parseDictionaryFile<TypedKhmerWordDictionaryIndexElement>(KM_RU_DICT_PATH, strToKhmerWordDictionaryIndexOrUndefined)

  validateUniqueHeadwords(dict)

  const grouped = mkGrouped(dict)

  // 3. Prepare the Query based on the strict insertion policy
  // If true: we use UPDATE (which does nothing if word is missing)
  // If false: we use INSERT OR REPLACE (standard upsert)
  const query = dontINSERTNewValuesIfWordDoesNotExistInDictButOnlyAddRussianTranslationIfWordIsAlreadyInDict
    ? `UPDATE km_en_tbl_Dict SET from_russian = $desc WHERE Word = $word`
    : `INSERT INTO km_en_tbl_Dict (Word, from_russian) VALUES ($word, $desc) ON CONFLICT(Word) DO UPDATE SET from_russian = excluded.from_russian`

  const stmt = db.prepare(query)

  // 4. Execute Migration
  console.log(
    `🚀 Starting migration (${dontINSERTNewValuesIfWordDoesNotExistInDictButOnlyAddRussianTranslationIfWordIsAlreadyInDict ? 'Update only' : 'Upsert'})...`,
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

  if (dontINSERTNewValuesIfWordDoesNotExistInDictButOnlyAddRussianTranslationIfWordIsAlreadyInDict) {
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
