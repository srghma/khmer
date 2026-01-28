import { Database } from 'bun:sqlite'
import fs from 'node:fs'

// --- CONFIG ---

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const TABLES = ['en_km_tbl_Dict', 'km_en_tbl_Dict']

// --- TYPES ---

type DictRow = {
  readonly rowid: number
  readonly Word: string
  readonly Desc: string
}

type IssueType = 'TRUNCATED_TAG' | 'ORPHANED_PV' | 'ORPHANED_FETYM'

type DetectedIssue = {
  readonly rowid: number
  readonly word: string
  readonly issueType: IssueType
  readonly snippet: string
}

// --- DETECTION LOGIC (Pure) ---

const isTruncatedAtEnd = (s: string): boolean => {
  // Matches SQL: Desc LIKE '%</A' OR Desc LIKE '%</B' OR Desc LIKE '%</FONT'
  // This automatically covers the specific noun/verb cases ending in </FONT
  return s.endsWith('</A') || s.endsWith('</B') || s.endsWith('</FONT')
}

const hasOrphanedPV = (s: string): boolean => {
  // Matches SQL: LIKE '%</PV>%' AND NOT LIKE '%<PV>%'
  return s.includes('</PV>') && !s.includes('<PV>')
}

const hasOrphanedFetym = (s: string): boolean => {
  // Matches SQL: LIKE '%</FETYM>%' AND NOT LIKE '%<FETYM>%'
  return s.includes('</FETYM>') && !s.includes('<FETYM>')
}

const analyzeRow = (row: DictRow): DetectedIssue[] => {
  const issues: DetectedIssue[] = []

  if (isTruncatedAtEnd(row.Desc)) {
    issues.push({
      rowid: row.rowid,
      word: row.Word,
      issueType: 'TRUNCATED_TAG',
      snippet: row.Desc.slice(-40), // Show the end of the string
    })
  }

  if (hasOrphanedPV(row.Desc)) {
    issues.push({
      rowid: row.rowid,
      word: row.Word,
      issueType: 'ORPHANED_PV',
      snippet: '... ' + row.Desc.substring(Math.max(0, row.Desc.indexOf('</PV>') - 20), row.Desc.indexOf('</PV>') + 5),
    })
  }

  if (hasOrphanedFetym(row.Desc)) {
    issues.push({
      rowid: row.rowid,
      word: row.Word,
      issueType: 'ORPHANED_FETYM',
      snippet:
        '... ' + row.Desc.substring(Math.max(0, row.Desc.indexOf('</FETYM>') - 20), row.Desc.indexOf('</FETYM>') + 8),
    })
  }

  return issues
}

// --- EXECUTION ---

const getTableRows = (db: Database, tableName: string): DictRow[] =>
  db.query(`SELECT rowid, Word, Desc FROM ${tableName}`).all() as DictRow[]

const runTable = (db: Database, tableName: string): void => {
  console.log(`\n\n=== SCANNING TABLE: ${tableName} ===`)
  console.log('Looking for: Truncated tags (</FONT, </A, </B>) & Orphaned </PV>, </FETYM>')
  console.log('-'.repeat(80))

  const rows = getTableRows(db, tableName)

  // Functional mapping and flattening
  const allIssues = rows.flatMap(analyzeRow)

  if (allIssues.length === 0) {
    console.log('✅ No issues found.')
    return
  }

  // Print Report
  console.log(`Found ${allIssues.length} issues:\n`)

  // Group by type for cleaner output
  const grouped = {
    TRUNCATED: allIssues.filter(i => i.issueType === 'TRUNCATED_TAG'),
    PV: allIssues.filter(i => i.issueType === 'ORPHANED_PV'),
    FETYM: allIssues.filter(i => i.issueType === 'ORPHANED_FETYM'),
  }

  if (grouped.TRUNCATED.length > 0) {
    console.log(`🔸 TRUNCATED TAGS (Need appending '>'): ${grouped.TRUNCATED.length}`)
    grouped.TRUNCATED.slice(0, 50).forEach(i => {
      console.log(`   [ID:${i.rowid}] ${i.word.padEnd(20)} -> ENDS WITH: "${i.snippet}"`)
    })
    if (grouped.TRUNCATED.length > 50) console.log(`   ... and ${grouped.TRUNCATED.length - 50} more.`)
  }

  if (grouped.PV.length > 0) {
    console.log(`\n🔸 ORPHANED </PV> (Need removing tag): ${grouped.PV.length}`)
    grouped.PV.forEach(i => {
      console.log(`   [ID:${i.rowid}] ${i.word.padEnd(20)} -> CTX: "${i.snippet}"`)
    })
  }

  if (grouped.FETYM.length > 0) {
    console.log(`\n🔸 ORPHANED </FETYM> (Need removing tag): ${grouped.FETYM.length}`)
    grouped.FETYM.forEach(i => {
      console.log(`   [ID:${i.rowid}] ${i.word.padEnd(20)} -> CTX: "${i.snippet}"`)
    })
  }
}

// --- MAIN ---

const main = () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ No DB found at ${DB_PATH}`)
    return
  }

  const db = new Database(DB_PATH)

  try {
    TABLES.forEach(table => runTable(db, table))
    console.log('\nScan complete.')
  } catch (e) {
    console.error(e)
  } finally {
    db.close()
  }
}

main()
