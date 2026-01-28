import { Database } from 'bun:sqlite'
import fs from 'node:fs'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const TABLES = ['en_km_tbl_Dict', 'km_en_tbl_Dict']
const SEPARATOR = '<br><hr><br>'

const truncate = (s: string, len: number = 60) =>
  s.length > len ? s.substring(0, len).replace(/\n/g, ' ') + '...' : s.replace(/\n/g, ' ')

const cleanupDuplicates = () => {
  if (!fs.existsSync(DB_PATH)) return
  const db = new Database(DB_PATH)

  try {
    // --- STEP 1: REPAIR PREVIOUS CORRUPTION ---
    console.log('🛠️  Repairing potential tag corruption from previous runs...')
    for (const table of TABLES) {
      const repairSup = db.run(`UPDATE ${table} SET Word = Word || '>' WHERE Word LIKE '%</sup'`)
      const repairSub = db.run(`UPDATE ${table} SET Word = Word || '>' WHERE Word LIKE '%</sub'`)
      if (repairSup.changes > 0 || repairSub.changes > 0) {
        console.log(`   ✅ Repaired ${repairSup.changes + repairSub.changes} tags in ${table}`)
      }
    }

    // --- STEP 2: SAFE CLEANUP ---
    for (const table of TABLES) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📦 PROCESSING TABLE: ${table}`)
      console.log(`${'='.repeat(60)}`)

      const rows = db
        .query(
          `
        SELECT rowid, Word, Desc
        FROM ${table}
        WHERE Word LIKE '% r>%'
           OR Word LIKE '% etc.%'
           OR Word LIKE '% r\u003e%'
           OR Word LIKE '% \u003e%'
      `,
        )
        .all() as any[]

      if (rows.length === 0) {
        console.log('✅ No corrupted patterns found.')
        continue
      }

      console.log(`🔍 Found ${rows.length} rows matching corruption patterns.`)

      const deletions: number[] = []
      let renamedCount = 0
      let mergedCount = 0

      for (const row of rows) {
        const baseWord = row.Word.replace(/\s+r(?:\\u003e|>)$/i, '')
          .replace(/\s+etc\.?$/i, '')
          .replace(/\s+(?:\\u003e|>)$/i, '')
          .trim()

        if (baseWord === row.Word) continue

        const baseEntry = db
          .query(`SELECT rowid, Desc FROM ${table} WHERE Word = ? AND rowid != ?`)
          .get(baseWord, row.rowid) as { rowid: number; Desc: string } | null

        if (baseEntry) {
          // --- MERGE LOGIC ---
          mergedCount++
          const mergedDesc = [...new Set([baseEntry.Desc, row.Desc])].join(SEPARATOR)
          console.log(`\n🔗 [MERGE] ID: ${row.rowid} -> ID: ${baseEntry.rowid}`)
          console.log(`   FROM: "${row.Word}"`)
          console.log(`   TO:   "${baseWord}"`)
          console.log(`   Appending Desc: "${row.Desc}"`)
          console.log(`   Merged: "${mergedDesc}"`)
          db.run(`UPDATE ${table} SET Desc = ? WHERE rowid = ?`, [mergedDesc, baseEntry.rowid])
          deletions.push(row.rowid)
        } else {
          // --- RENAME LOGIC ---
          renamedCount++
          console.log(`\n🔄 [RENAME] ID: ${row.rowid}`)
          console.log(`   Original: "${row.Word}"`)
          console.log(`   Fixed:    "${baseWord}"`)

          db.run(`UPDATE ${table} SET Word = ? WHERE rowid = ?`, [baseWord, row.rowid])
        }
      }

      // --- EXECUTE DELETIONS ---
      if (deletions.length > 0) {
        const deleteStmt = db.prepare(`DELETE FROM ${table} WHERE rowid = ?`)
        db.transaction(() => {
          for (const id of deletions) deleteStmt.run(id)
        })()
      }

      console.log(`\n📊 SUMMARY FOR ${table}:`)
      console.log(`   - Renamed: ${renamedCount}`)
      console.log(`   - Merged:  ${mergedCount}`)
      console.log(`   - Deleted: ${deletions.length}`)
    }

    console.log(`\n${'-'.repeat(60)}`)
    console.log('🧹 VACUUMing database...')
    db.run('VACUUM;')
    console.log('🎉 Cleanup complete.')
  } catch (err) {
    console.error('\n❌ CRITICAL ERROR:', err)
  } finally {
    db.close()
  }
}

cleanupDuplicates()
