import { Database } from 'bun:sqlite'
import fs from 'node:fs'
import { assertIsDefinedAndReturn } from './utils/asserts'

// --- TYPES ---
type TableName = 'en_km_tbl_Dict' | 'km_en_tbl_Dict'

interface RawRow {
  Word: string
  WordDisplay: string
  Desc: string
}

interface MergedRow {
  Word: string
  WordDisplay: string
  Desc: string
}

type ProcessResult = {
  merged: MergedRow
  isError: boolean
  ruleApplied: string
}

// --- CONFIGURATION ---
const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const SEPARATOR = '<br><hr><br>'

// --- CORE MERGE LOGIC ---

const processGroup = (word: string, rows: RawRow[]): ProcessResult => {
  if (!word.trim() || rows.some(r => !r.Desc.trim())) {
    return {
      merged: { Word: word, WordDisplay: '', Desc: '' },
      isError: true,
      ruleApplied: 'ERROR',
    }
  }

  const nonEmptyDisplayRows = rows.filter(r => r.WordDisplay && r.WordDisplay.trim() !== '')
  const uniqueDisplays = new Set(nonEmptyDisplayRows.map(r => r.WordDisplay.trim()))

  let finalDisplay = ''
  let finalDesc = ''
  let rule = ''

  if (uniqueDisplays.size > 1) {
    rule = 'RULE 3 (Conflicting Displays -> Desc)'
    const sorted = [...rows].sort((a, b) => (a.WordDisplay || '').localeCompare(b.WordDisplay || ''))
    finalDisplay = ''
    finalDesc = sorted
      .map(r => {
        const header = r.WordDisplay.trim() ? `<B>${r.WordDisplay.trim()}</B><BR>` : ''
        return header + r.Desc.trim()
      })
      .join(SEPARATOR)
  } else if (uniqueDisplays.size === 1) {
    rule = 'RULE 1 (Single Display Shared)'
    finalDisplay = assertIsDefinedAndReturn(Array.from(uniqueDisplays)[0])
    const primaryRows = rows.filter(r => r.WordDisplay.trim() === finalDisplay)
    const secondaryRows = rows.filter(r => r.WordDisplay.trim() !== finalDisplay)
    finalDesc = [...primaryRows, ...secondaryRows].map(r => r.Desc.trim()).join(SEPARATOR)
  } else {
    rule = 'RULE 2 (All Displays Empty)'
    finalDisplay = ''
    finalDesc = rows.map(r => r.Desc.trim()).join(SEPARATOR)
  }

  return {
    merged: { Word: word, WordDisplay: finalDisplay, Desc: finalDesc },
    isError: false,
    ruleApplied: rule,
  }
}

// --- LOGGING ---

const logMergeAction = (word: string, inputs: RawRow[], output: ProcessResult) => {
  console.log(`\n📦 [MERGE ACTION] Word: "${word}"`)
  console.log(`   IN (Current Rows in DB):`)
  inputs.forEach((r, i) => {
    console.log(`     [${i}] Display: "${r.WordDisplay}" | Desc: ${r.Desc}`)
  })
  console.log(`   OUT (Data to be Prepared):`)
  console.log(`     Rule:    ${output.ruleApplied}`)
  console.log(`     Display: "${output.merged.WordDisplay}"`)
  console.log(`     Desc:    ${output.merged.Desc}`)
  console.log(`   ${'-'.repeat(40)}`)
}

// --- PIPELINE ---

const groupRowsByWord = (rows: RawRow[]): Map<string, RawRow[]> => {
  return rows.reduce((acc, row) => {
    const key = row.Word.trim()
    if (!key) return acc
    const group = acc.get(key) || []
    group.push(row)
    acc.set(key, group)
    return acc
  }, new Map<string, RawRow[]>())
}

const processTable = async (db: Database, tableName: TableName): Promise<MergedRow[] | null> => {
  console.log(`\n--- Processing Table: ${tableName} ---`)
  const rows = db.query(`SELECT Word, WordDisplay, Desc FROM ${tableName}`).all() as RawRow[]
  const grouped = groupRowsByWord(rows)
  const mergedData: MergedRow[] = []
  let hasTableError = false

  for (const [word, group] of grouped) {
    const result = processGroup(word, group)

    // Only log if an actual merge (multiple rows) is happening
    if (group.length > 1) {
      logMergeAction(word, group, result)
    }

    if (result.isError) {
      console.error(`❌ CRITICAL ERROR for word: "${word}"`)
      hasTableError = true
    }
    mergedData.push(result.merged)
  }

  return hasTableError ? null : mergedData
}

// --- DB OPERATIONS ---

const applyUpdates = (db: Database, updates: { tableName: TableName; data: MergedRow[] }[]) => {
  db.transaction(() => {
    db.run('PRAGMA foreign_keys=OFF;')
    for (const update of updates) {
      const { tableName, data } = update
      const tempTable = `${tableName}_new`
      db.run(`DROP TABLE IF EXISTS ${tempTable};`)
      db.run(`CREATE TABLE ${tempTable} (Word TEXT(50) NOT NULL PRIMARY KEY, WordDisplay TEXT, Desc TEXT NOT NULL);`)
      const insertStmt = db.prepare(
        `INSERT INTO ${tempTable} (Word, WordDisplay, Desc) VALUES ($Word, $WordDisplay, $Desc)`,
      )
      for (const row of data) {
        insertStmt.run({
          $Word: row.Word,
          $WordDisplay: row.WordDisplay,
          $Desc: row.Desc,
        })
      }
      db.run(`DROP TABLE IF EXISTS ${tableName};`)
      db.run(`ALTER TABLE ${tempTable} RENAME TO ${tableName};`)
      db.run(`CREATE INDEX IF NOT EXISTS ${tableName}_Word_index ON ${tableName}(Word ASC);`)
    }
  })()
  db.run('VACUUM;')
}

const main = async () => {
  if (!fs.existsSync(DB_PATH)) process.exit(1)
  const db = new Database(DB_PATH)
  try {
    const tableNames: TableName[] = ['en_km_tbl_Dict', 'km_en_tbl_Dict']
    const allTableUpdates: { tableName: TableName; data: MergedRow[] }[] = []

    for (const tableName of tableNames) {
      const result = await processTable(db, tableName)
      if (result === null) {
        console.error('\n🛑 ABORTING: Critical errors found. No changes were written.')
        process.exit(1)
      }
      allTableUpdates.push({ tableName, data: result })
    }

    console.log('\n✅ All validations passed. Committing prepared data to database...')
    applyUpdates(db, allTableUpdates)
    console.log('🎉 SUCCESS! Merge complete.')
  } catch (e) {
    console.error(e)
  } finally {
    db.close()
  }
}

main()
