import { Database } from 'bun:sqlite'
import fs from 'node:fs'
import { processTsvFile } from '/home/srghma/projects/khmer/dicts/src/wiktionary-parse.ts'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'

const NEW_COLUMNS = ['from_csv_variants', 'from_csv_nounForms', 'from_csv_pronunciations', 'from_csv_rawHtml']

/**
 * Helper to return null if array is empty, otherwise JSON string
 */
const toSqlValue = (arr: any[]) => {
  return arr && arr.length > 0 ? JSON.stringify(arr) : null
}

const migrate = async () => {
  if (!fs.existsSync(DB_PATH)) throw new Error('Database not found')

  console.log('📖 Parsing TSV file...')
  const entries = await processTsvFile()
  console.log(`✅ Parsed ${entries.length} entries.`)

  const db = new Database(DB_PATH)

  try {
    // 1. Ensure columns exist
    const tableInfo = db.query('PRAGMA table_info(km_en_tbl_Dict)').all() as {
      name: string
    }[]
    const existingCols = new Set(tableInfo.map(c => c.name))

    for (const col of NEW_COLUMNS) {
      if (!existingCols.has(col)) {
        console.log(`➕ Adding column: ${col}`)
        db.run(`ALTER TABLE km_en_tbl_Dict ADD COLUMN ${col} TEXT`)
      }
    }

    /**
     * 2. Prepare UPSERT statement
     * - If Word exists: Update the from_csv columns.
     * - If Word doesn't exist: Insert new row, using rawHtml as the default 'Desc'
     *   to satisfy the NOT NULL CHECK constraint.
     */
    const upsertStmt = db.prepare(`
      INSERT INTO km_en_tbl_Dict (
        Word,
        from_csv_variants,
        from_csv_nounForms,
        from_csv_pronunciations,
        from_csv_rawHtml
      ) VALUES (
        $word,
        $variants,
        $nounForms,
        $pronunciations,
        $html
      )
      ON CONFLICT(Word) DO UPDATE SET
        from_csv_variants = excluded.from_csv_variants,
        from_csv_nounForms = excluded.from_csv_nounForms,
        from_csv_pronunciations = excluded.from_csv_pronunciations,
        from_csv_rawHtml = excluded.from_csv_rawHtml
    `)

    console.log('🚀 Syncing data to database (Update existing / Insert new)...')

    let processedCount = 0
    const transaction = db.transaction(data => {
      for (const entry of data) {
        upsertStmt.run({
          $word: entry.headword.word,
          $variants: toSqlValue(entry.headword.variants),
          $nounForms: toSqlValue(entry.headword.nounForms),
          $pronunciations: toSqlValue(entry.headword.pronunciations),
          $html: entry.rawHtml,
        })
        processedCount++
      }
    })

    transaction(entries)

    // Calculate how many were brand new
    const totalInDb = db.query('SELECT COUNT(*) as count FROM km_en_tbl_Dict').get() as { count: number }

    console.log(`\n✨ Sync complete!`)
    console.log(`   Total TSV entries processed: ${processedCount}`)
    console.log(`   Total words now in DB:       ${totalInDb.count}`)

    console.log('🧹 Optimizing...')
    db.run('VACUUM;')
  } catch (err) {
    console.error('❌ Sync failed:', err)
  } finally {
    db.close()
  }
}

migrate()
