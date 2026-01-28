import { Database } from 'bun:sqlite'
import fs from 'node:fs'

// --- CONFIG ---

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const TABLES = ['en_km_tbl_Dict', 'km_en_tbl_Dict']

// --- TYPES ---

type DictRow = {
  readonly rowid: number
  readonly Word: string
  readonly WordDisplay: string | null
  readonly Desc: string
}

type ProcessingError = {
  readonly rowid: number
  readonly word: string
  readonly field: 'WordDisplay' | 'Desc'
  readonly forbiddenCharHex: string
}

type UpdateOp = DictRow

type ProcessingResult =
  | { readonly kind: 'error'; readonly error: ProcessingError }
  | { readonly kind: 'update'; readonly update: UpdateOp }
  | { readonly kind: 'clean' }

// --- LOGIC (Pure) ---

const windows1252Decoder = new TextDecoder('windows-1252')

const decodeCharFromCp1252 = (char: string): string => windows1252Decoder.decode(new Uint8Array([char.charCodeAt(0)]))

/**
 * 1. Decodes Windows-1252 (CP1252) specific range (\x80-\x9F).
 * 2. Strips all binary garbage and non-whitespace control characters.
 */
/**
 * 1. Decodes Windows-1252 (CP1252) specific range (\x80-\x9F).
 * 2. Strips specific undefined Windows-1252 bytes.
 * 3. Strips all binary garbage and non-whitespace control characters.
 */
const repairLegacyString = (text: string | null | undefined): string => {
  if (!text) return ''

  return (
    text
      // 1. Remove specific bytes that are UNDEFINED in Windows-1252
      // These are the ones causing your safety check failures.
      .replace(/[\x81\x8D\x8F\x90\x9D]/g, '')

      // 2. Convert valid Windows-1252 symbols (Quotes, Euro, Bullets, etc.)
      .replace(/[\x80-\x9F]/g, decodeCharFromCp1252)

      // 3. Remove Forbidden Low-ASCII Control Characters
      // \x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

      // 4. Trim whitespace
      .trim()
  )
}

const findForbiddenChar = (text: string): string | undefined => {
  const match = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\x80-\x9F]/)
  if (!match) return undefined
  const charCode = match[0].charCodeAt(0)
  return `0x${charCode.toString(16).toUpperCase().padStart(2, '0')}`
}

// --- DB ---

const getTableRows = (db: Database, tableName: string): DictRow[] =>
  db.query(`SELECT rowid, Word, WordDisplay, Desc FROM ${tableName}`).all() as DictRow[]

// --- PIPELINE ---

const logError = (e: ProcessingError) => {
  console.error(`\n❌ SAFETY CHECK FAILED | ID: ${e.rowid} | Word: "${JSON.stringify(e.word)}"`)
  console.error(`   Field: ${e.field}`)
  console.error(`   Forbidden Char Found: ${e.forbiddenCharHex}`)
  console.error('-'.repeat(50))
}

const processRow = (row: DictRow): ProcessingResult => {
  const fixedDisplay = repairLegacyString(row.WordDisplay)
  const fixedDesc = repairLegacyString(row.Desc)

  // Check WordDisplay for forbidden chars
  const badCharDisplay = findForbiddenChar(fixedDisplay)
  if (badCharDisplay) {
    const error: ProcessingError = {
      rowid: row.rowid,
      word: row.Word,
      field: 'WordDisplay',
      forbiddenCharHex: badCharDisplay,
    }
    logError(error)
    return { kind: 'error', error }
  }

  // Check Desc for forbidden chars
  const badCharDesc = findForbiddenChar(fixedDesc)
  if (badCharDesc) {
    const error: ProcessingError = {
      rowid: row.rowid,
      word: row.Word,
      field: 'Desc',
      forbiddenCharHex: badCharDesc,
    }
    logError(error)
    return { kind: 'error', error }
  }

  // If content has changed, flag for update
  if (fixedDisplay !== (row.WordDisplay ?? '') || fixedDesc !== row.Desc) {
    return {
      kind: 'update',
      update: { ...row, WordDisplay: fixedDisplay, Desc: fixedDesc },
    }
  }

  return { kind: 'clean' }
}

const commitUpdates = (db: Database, tableName: string, updates: DictRow[]): void => {
  if (updates.length === 0) return

  console.log(`✅ Applying ${updates.length} updates to ${tableName}...`)

  const transaction = db.transaction((items: DictRow[]) => {
    const updateStmt = db.prepare(
      `UPDATE ${tableName} SET WordDisplay = $WordDisplay, Desc = $Desc WHERE rowid = $rowid`,
    )

    items.forEach(item => {
      updateStmt.run({
        $WordDisplay: item.WordDisplay,
        $Desc: item.Desc,
        $rowid: item.rowid,
      })
    })
  })

  transaction(updates)
  console.log(`Updates committed.`)
}

const runTable = (db: Database, tableName: string): void => {
  console.log(`\n--- Processing Table: ${tableName} ---`)

  const rows = getTableRows(db, tableName)
  console.log(`Total rows: ${rows.length}`)

  const results: ProcessingResult[] = rows.map(processRow)

  const errors = results.filter((r): r is { kind: 'error'; error: ProcessingError } => r.kind === 'error')
  const updates = results
    .filter((r): r is { kind: 'update'; update: UpdateOp } => r.kind === 'update')
    .map(r => r.update)
  const cleanCount = results.filter(r => r.kind === 'clean').length

  console.log(`Stats: Updates: ${updates.length}, Errors: ${errors.length}, Clean: ${cleanCount}`)

  if (errors.length > 0) {
    console.log(`⚠️  ABORTING ${tableName}: Found ${errors.length} forbidden artifacts. Check logs above.`)
    return
  }

  commitUpdates(db, tableName, updates)
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
    console.log('\nDone.')
  } catch (e) {
    console.error(e)
  } finally {
    db.close()
  }
}

main()
