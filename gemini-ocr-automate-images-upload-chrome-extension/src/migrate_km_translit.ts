import { Database } from 'bun:sqlite'
import { strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined } from './utils/khmer-word'
import { khmerToRussian } from './utils/khmerToRussian'
import { slugify } from './utils/slugifyKhmer'
import { String_toNonEmptyString_orUndefined_afterTrim } from './utils/non-empty-string-trimmed'

// --- Configuration ---

const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  /**
   * If true, sets the configured columns to NULL for all rows before starting the migration.
   */
  CLEAN_COLUMNS_BEFORE_START: false,
}

// --- Main Migration Logic ---

async function main() {
  const db = new Database(CONFIG.DB_PATH)

  console.log('🔍 Checking database schema...')

  // 1. Check if columns exist, create them if they don't
  const info = db.query('PRAGMA table_info(km_Dict)').all() as {
    name: string
  }[]

  const hasRuTranslit = info.some(c => c.name === 'my_ru_translit')
  const hasEnTranslit = info.some(c => c.name === 'my_en_translit')

  if (!hasRuTranslit) {
    console.log('➕ Adding column "my_ru_translit"...')
    db.run('ALTER TABLE km_Dict ADD COLUMN my_ru_translit TEXT')
  }

  if (!hasEnTranslit) {
    console.log('➕ Adding column "my_en_translit"...')
    db.run('ALTER TABLE km_Dict ADD COLUMN my_en_translit TEXT')
  }

  // 2. Optional: Clean existing data
  if (CONFIG.CLEAN_COLUMNS_BEFORE_START) {
    console.log('🧹 Cleaning existing transliteration data...')
    db.run('UPDATE km_Dict SET my_ru_translit = NULL, my_en_translit = NULL')
  }

  // 3. Fetch all words from the database
  console.log('📖 Fetching all words from km_Dict...')
  const allWords = db.query('SELECT Word FROM km_Dict').all() as { Word: string }[]
  console.log(`   Found ${allWords.length} words to process`)

  // 4. Prepare update statement
  const updateStmt = db.prepare(
    'UPDATE km_Dict SET my_ru_translit = $ru, my_en_translit = $en WHERE Word = $word'
  )

  // 5. Process all words in a transaction
  console.log('🚀 Starting transliteration migration...')
  let processedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  const startTime = Date.now()

  db.transaction(() => {
    for (const { Word: word } of allWords) {
      processedCount++

      // Compute Russian transliteration
      const ru_translit_ = strToKhmerWord_remove_nonKhmerOnBothEnds_orUndefined(word)
      const ru_translit = ru_translit_ ? khmerToRussian(ru_translit_) : undefined

      // Compute English transliteration
      const en_translit = String_toNonEmptyString_orUndefined_afterTrim(slugify(word, ' '))

      // Only update if at least one transliteration was computed
      if (ru_translit !== undefined || en_translit !== undefined) {
        const result = updateStmt.run({
          $word: word,
          $ru: ru_translit ?? null,
          $en: en_translit ?? null,
        })
        updatedCount += result.changes
      } else {
        skippedCount++
      }

      // Progress indicator every 1000 words
      if (processedCount % 1000 === 0) {
        console.log(`   Progress: ${processedCount}/${allWords.length} words processed...`)
      }
    }
  })()

  const endTime = Date.now()
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

  console.log('\n✨ Migration completed!')
  console.log(`   Total words processed:     ${processedCount}`)
  console.log(`   Rows updated:              ${updatedCount}`)
  console.log(`   Rows skipped (no translit): ${skippedCount}`)
  console.log(`   Duration:                  ${durationSeconds}s`)

  console.log('\n🧹 Optimizing database...')
  db.run('VACUUM;')

  db.close()
  console.log('✅ Done!')
}

main().catch(console.error)
