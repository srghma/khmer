import { Database } from 'bun:sqlite'
import fs from 'node:fs'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const TABLES = ['en_km_tbl_Dict', 'km_en_tbl_Dict']

const cleanup = () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found.')
    return
  }

  const db = new Database(DB_PATH)

  try {
    db.transaction(() => {
      for (const table of TABLES) {
        console.log(`\n--- Auditing Table: ${table} ---`)

        // 1. Identify and Log the rows
        // We look for <b>word</b> or <B>word</B> case-insensitively
        const query = `
          SELECT rowid, Word, WordDisplay
          FROM ${table}
          WHERE WordDisplay IS NOT NULL
            AND (
                 WordDisplay = Word
              OR WordDisplay = '<B>' || Word || '</B>'
              OR WordDisplay = '<B>' || Word || '</B>'
              OR WordDisplay = '<b>' || LOWER(Word) || '</b>'
              OR WordDisplay = '<B>' || UPPER(Word) || '</B>'
            )
        `

        const redundantRows = db.query(query).all() as {
          rowid: number
          Word: string
          WordDisplay: string
        }[]

        if (redundantRows.length === 0) {
          console.log(`✅ No redundant bold WordDisplays found in ${table}.`)
          continue
        }

        console.log(`🔍 Found ${redundantRows.length} redundant displays. Logging examples:`)

        redundantRows.forEach((row, i) => {
          if (i < 10) {
            // Log first 10 as examples
            console.log(
              `   [ID: ${row.rowid}] Word: "${row.Word}" | Redundant Display: "${row.WordDisplay}" -> Clearing`,
            )
          }
        })

        if (redundantRows.length > 10) console.log(`   ... and ${redundantRows.length - 10} more.`)

        // 2. Execute the Update
        const updateQuery = `
          UPDATE ${table}
          SET WordDisplay = ''
          WHERE WordDisplay = Word
             OR WordDisplay = '<b>' || Word || '</b>'
             OR WordDisplay = '<B>' || Word || '</B>'
             OR WordDisplay = '<b>' || LOWER(Word) || '</b>'
             OR WordDisplay = '<B>' || UPPER(Word) || '</B>'
        `

        const result = db.run(updateQuery)
        console.log(`🚀 Updated ${result.changes} rows in ${table}.`)
      }
    })()

    console.log('\nVACUUMing database...')
    db.run('VACUUM;')
    console.log('🎉 Done.')
  } catch (err) {
    console.error('❌ Error during cleanup:', err)
  } finally {
    db.close()
  }
}

cleanup()
