import { Database } from 'bun:sqlite'
import fs from 'node:fs'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const TABLES = ['en_km_tbl_Dict', 'km_en_tbl_Dict']

const runMove = () => {
  if (!fs.existsSync(DB_PATH)) return
  const db = new Database(DB_PATH)

  try {
    for (const table of TABLES) {
      console.log(`\n--- Processing Table: ${table} ---`)

      const rows = db
        .query(`SELECT rowid, Word, WordDisplay, Desc FROM ${table} WHERE WordDisplay LIKE '%<font color=#009900%'`)
        .all() as any[]

      const updates: { rowid: number; WordDisplay: string; Desc: string }[] = []

      for (const row of rows) {
        const display = row.WordDisplay.trim()

        /**
         * REGEX BREAKDOWN:
         * 1. (.*?)                                  : Group 1 - The Headword text we likely want to keep.
         * 2. \s*                                    : Optional spaces.
         * 3. (<font color=#000099>[^<]*<\/font>\s*)?: Group 2 - Optional Blue metadata tag (like "Medicine").
         * 4. ([P`|~ÊÚ¾¼½±ÌH+„\x80-\xFF\s]{1,10})     : Group 3 - The JUNK symbols to DISCARD.
         * 5. (<font color=#009900.*)$               : Group 4 - The GREEN phonetic tag to move.
         */
        const regex =
          /^(.*?)?\s*(<font color=#000099>[^<]*<\/font>\s*)?([P`|~ÊÚ¾¼½±ÌH+„\x80-\xFF\s]{1,10})(<font color=#009900.*)$/i
        const match = display.match(regex)

        if (match) {
          const keepPart = (match[1] || '').trim()
          const metadataTag = (match[2] || '').trim()
          const phoneticTag = match[4].trim()

          // 1. Prepare what goes into Desc (Metadata tag + Phonetic tag, NO JUNK)
          const movePart = (metadataTag + phoneticTag).trim()

          // 2. Prepare what stays in WordDisplay
          let finalDisplay = keepPart

          // 3. Redundancy Check: Clear WordDisplay if it matches the Word key
          // We normalize (lowercase, remove spaces/symbols) to compare accurately
          const normalize = (s: string) => s.toLowerCase().replace(/[ &]/g, '')
          const wordNorm = normalize(row.Word)
          const keepNorm = normalize(finalDisplay)
          const truncatedWordNorm = normalize(row.Word.slice(1))

          if (
            keepNorm === wordNorm ||
            keepNorm === truncatedWordNorm ||
            keepNorm === normalize('-' + row.Word) ||
            !finalDisplay
          ) {
            finalDisplay = ''
          }

          const newDesc = `${movePart}<BR>${row.Desc}`

          console.log(`\n🚚 [MOVE] ID: ${row.rowid} | Word: "${row.Word}"`)
          console.log(`   FROM WordDisplay: "${display}"`)
          console.log(`   TO WordDisplay:   "${finalDisplay}"`)
          console.log(`   TO Desc (start):  "${newDesc.substring(0, 100)}..."`)

          updates.push({
            rowid: row.rowid,
            WordDisplay: finalDisplay,
            Desc: newDesc,
          })
        }
      }

      if (updates.length > 0) {
        console.log(`\n${'='.repeat(50)}`)
        console.log(`✅ Committing ${updates.length} clean migrations to ${table}...`)

        const transaction = db.transaction(items => {
          const stmt = db.prepare(`UPDATE ${table} SET WordDisplay = $WD, Desc = $Desc WHERE rowid = $rowid`)
          for (const item of items) {
            stmt.run({
              $WD: item.WordDisplay,
              $Desc: item.Desc,
              $rowid: item.rowid,
            })
          }
        })

        transaction(updates)
      }
    }

    console.log('\nVACUUMing database...')
    db.run('VACUUM;')
    console.log('🎉 Done.')
  } finally {
    db.close()
  }
}

runMove()
