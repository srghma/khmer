import { Database } from 'bun:sqlite'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'

const db = new Database(DB_PATH)

type CheckPair = {
  childTable: string
  parentTable: string
  column: string
}

const pairs: CheckPair[] = [
  {
    childTable: 'en_km_tbl_Extension',
    parentTable: 'en_km_tbl_Dict',
    column: 'Word',
  },
  {
    childTable: 'km_en_tbl_Word',
    parentTable: 'km_en_tbl_Dict',
    column: 'WordOrder',
  },
]

const check = () => {
  console.log('🧐 Auditing Database Integrity for Foreign Keys...\n')
  let totalViolations = 0

  for (const { childTable, parentTable, column } of pairs) {
    console.log(`Checking [${childTable}] -> [${parentTable}]...`)

    // We select the rows that would violate a Foreign Key constraint
    const violations = db
      .query(
        `
      SELECT * FROM ${childTable}
      WHERE ${column} NOT IN (SELECT ${column} FROM ${parentTable})
    `,
      )
      .all() as any[]

    if (violations.length === 0) {
      console.log(`   ✅ Perfect. All records refer to valid entries in ${parentTable}.\n`)
    } else {
      console.error(`   ❌ VIOLATION: Found ${violations.length} orphaned rows in ${childTable}.`)
      console.error(`   These words exist in ${childTable} but are missing from ${parentTable}:`)

      // Print details of the first 20 violations
      violations.slice(0, 20).forEach((row, i) => {
        const details = Object.entries(row)
          .map(([k, v]) => `${k}: "${v}"`)
          .join(' | ')
        console.error(`     Row [${i + 1}]: ${details}`)
      })

      if (violations.length > 20) {
        console.error(`     ... and ${violations.length - 20} more rows.`)
      }
      console.log('')
      totalViolations += violations.length
    }
  }

  console.log('='.repeat(50))
  if (totalViolations === 0) {
    console.log('🎉 RESULT: Foreign Keys can be added successfully!')
  } else {
    console.error(`🛑 RESULT: Found ${totalViolations} orphaned records across tables.`)
    console.error('You must delete or fix these rows before adding Foreign Key constraints.')
  }
}

try {
  check()
} finally {
  db.close()
}
