import { Database } from 'bun:sqlite'
import { Window } from 'happy-dom'
import { assertIsDefined } from './utils/asserts'

// --- 1. CONFIGURATION ---
const DB_PATH = '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db' // <--- CHECK PATH

// ANSI Colors for Pretty Logs
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

// --- 2. TYPES & YOUR SPECIFIED FUNCTIONS ---

type Row = {
  Word: string
  WordDisplay: string | null
  Desc: string | null
  Desc_en_only: string | null
  en_km_com: string | null
}

// Check 2: (Included as requested, though not used in your provided merge() body)
function merge_row_only_one_should_be_null(invalidVal: string | null, validVal: string | null) {
  if (invalidVal === validVal) return validVal
  if (validVal !== null && validVal !== '') {
    if (invalidVal !== null && invalidVal !== '') {
      throw new Error(`Conflict: Both rows contain data:\n  ${invalidVal}'\nvs\n  ${validVal}`)
    }
    return validVal
  }
  if (invalidVal === null || invalidVal === '') {
    throw new Error(`Conflict: Both rows are empty`)
  }
  return invalidVal
}

// The Merge Logic
function merge(invalidRow: Row, validRow: Row): Row {
  return {
    Word: invalidRow.Word,
    WordDisplay: merge_row_only_one_should_be_null(invalidRow.WordDisplay, validRow.WordDisplay),
    Desc: merge_row_only_one_should_be_null(invalidRow.Desc, validRow.Desc),
    Desc_en_only: merge_row_only_one_should_be_null(invalidRow.Desc_en_only, validRow.Desc_en_only),
    en_km_com: validRow.en_km_com, // We take the HTML from the "valid" row
  }
}

// --- 3. HELPER: CONTENT CLEANER ---

class DefinitionNormalizer {
  private window: Window
  private doc: Document

  constructor() {
    this.window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
    this.doc = this.window.document as unknown as Document
  }

  free() {
    this.window.close()
  }

  // Returns a fingerprint of the HTML content (stripping tags/images) to find duplicates
  getFingerprint(html: string | null): string {
    if (!html) return ''

    // Basic string cleanup
    const preCleaned = html.replace(/[\uFEFF\u200B]/g, '').trim()

    this.doc.body.innerHTML = preCleaned

    // Remove elements that differ between versions (images differ by src, so remove them)
    const variableElements = this.doc.querySelectorAll('img, audio, script, style, link, meta')
    for (const el of variableElements) el.remove()

    // Normalize text to ensure matches
    return this.doc.body.innerHTML
      .replace(/[\t\n\r]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }
}

// --- 4. HELPER: ROW IDENTIFICATION ---

// Based on your example:
// Valid (Short)  : src="/en_Dict_en_km_com_assets_images/1298.webp"
// Invalid (Long) : src="en_Dict_en_km_com_assets_images/fb5b66...webp" or src="9DB12AFC.bmp"

function identifyRows(rowA: Row, rowB: Row): { invalid: Row; valid: Row } | null {
  const isShortRegex = /\/en_Dict_en_km_com_assets_images\/\d+\.webp/

  const aIsShort = rowA.en_km_com && isShortRegex.test(rowA.en_km_com)
  const bIsShort = rowB.en_km_com && isShortRegex.test(rowB.en_km_com)

  // We need exactly one "Short" (Valid) and one "Long" (Invalid)
  if (aIsShort && !bIsShort) {
    return { valid: rowA, invalid: rowB }
  }
  if (!aIsShort && bIsShort) {
    return { valid: rowB, invalid: rowA }
  }

  // Ambiguous case (both short or both long)
  return null
}

// --- 5. MAIN SCRIPT ---

async function run() {
  console.log(`${C.bright}${C.cyan}╔════════════════════════════════════════╗${C.reset}`)
  console.log(`${C.bright}${C.cyan}║   Duplicate Merge: Long vs Short Img   ║${C.reset}`)
  console.log(`${C.bright}${C.cyan}╚════════════════════════════════════════╝${C.reset}`)

  const db = new Database(DB_PATH)
  const normalizer = new DefinitionNormalizer()

  console.log(`${C.gray}Reading database...${C.reset}`)
  const rows = db
    .query(`SELECT * FROM en_Dict WHERE en_km_com IS NOT NULL AND en_km_com LIKE '%en_Dict_en_km_com_assets_images%' `)
    .all() as Row[]
  console.log(`${C.blue}ℹ Total rows with definitions:${C.reset} ${rows.length}`)

  // --- Step 1: Group by Content ---
  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = normalizer.getFingerprint(row.en_km_com)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  // --- Step 2: Prepare Operations ---
  const operations: { merged: Row; deleteWord: string }[] = []
  let skippedCount = 0
  let errorCount = 0

  console.log(`\n${C.yellow}Analyzing duplicates...${C.reset}`)

  for (const [key, group] of groups.entries()) {
    if (group.length !== 2) continue // Constraint: "exactly 2 duplicates"

    const [r1, r2] = group
    assertIsDefined(r1)
    assertIsDefined(r2)
    const pairId = identifyRows(r1, r2)

    if (!pairId) {
      console.log(
        `${C.gray}  [SKIP] Ambiguous pair: '${r1.Word}' & '${r2.Word}' (Couldn't determine valid/invalid)${C.reset}`,
      )
      skippedCount++
      continue
    }

    const { invalid, valid } = pairId

    try {
      // ⚡ CALLING YOUR FUNCTION ⚡
      const mergedResult = merge(invalid, valid)

      // If merge succeeded, queue it
      operations.push({
        merged: mergedResult,
        deleteWord: valid.Word, // We delete the "valid" row (the one with short img but no metadata)
      })

      console.log(
        `${C.green}  [OK]${C.reset} Invalid: ${C.bright}${invalid.Word.padEnd(15)}${C.reset} (Keep Meta) + Valid: ${C.dim}${valid.Word}${C.reset}`,
      )
    } catch (e: any) {
      console.log(`${C.red}  [ERR]${C.reset} Pair '${invalid.Word}' & '${valid.Word}': ${e.message}`)
      errorCount++
    }
  }

  normalizer.free()

  // --- Step 3: Execute ---
  console.log(`\n${C.bright}Summary:${C.reset}`)
  console.log(`  ${C.green}✔ Ready to merge:${C.reset}  ${operations.length}`)
  console.log(`  ${C.yellow}⚠ Skipped:${C.reset}         ${skippedCount}`)
  console.log(`  ${C.red}✖ Errors:${C.reset}          ${errorCount}`)

  if (operations.length === 0) {
    console.log(`\n${C.gray}No changes needed.${C.reset}`)
    return
  }

  console.log(`\n${C.cyan}Writing changes to DB...${C.reset}`)

  const updateStmt = db.prepare(`UPDATE en_Dict SET en_km_com = $html WHERE Word = $word`)
  const deleteStmt = db.prepare(`DELETE FROM en_Dict WHERE Word = $word`)

  db.transaction(ops => {
    for (const op of ops) {
      // 1. Update the "Invalid" row with the new merged HTML
      updateStmt.run({
        $html: op.merged.en_km_com,
        $word: op.merged.Word,
      })
      // 2. Delete the "Valid" row (since its content is now merged into the other)
      deleteStmt.run({
        $word: op.deleteWord,
      })
    }
  })(operations)

  console.log(`${C.green}${C.bright}Done! Vacuuming database...${C.reset}`)
  db.run('VACUUM;')
  console.log(`${C.cyan}Process Complete.${C.reset}`)
}

run()
