import { Database } from 'bun:sqlite'
import { HtmlValidate, type ConfigData } from 'html-validate'
import fs from 'node:fs'
import * as readline from 'node:readline/promises'

// --- TYPES ---

type DictRow = {
  readonly rowid: number
  readonly Word: string
  readonly Desc: string
}

type ProcessingError = {
  readonly rowid: number
  readonly word: string
  readonly original: string
  readonly autoFixed: string
  readonly error: string
}

type UpdateOp = DictRow

type ProcessingResult =
  | { readonly kind: 'skipped' }
  | { readonly kind: 'error'; readonly error: ProcessingError }
  | { readonly kind: 'update'; readonly update: UpdateOp }
  | { readonly kind: 'clean' }

// --- CONFIG ---

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'

const validatorConfig: ConfigData = {
  extends: [],
  rules: {
    'close-order': 'error',
    'no-dup-id': 'off',
    'no-raw-characters': 'off',
    'unrecognized-char-ref': 'off',
    'void-content': 'off',
    'void-style': 'off',
    'attr-quotes': 'off',
    'element-case': 'off',
    'attr-case': 'off',
    'attribute-empty-style': 'off',
    'no-inline-style': 'off',
    'element-permitted-content': 'off',
    'no-unknown-elements': 'off',
    deprecated: 'off',
    'missing-doctype': 'off',
    'doctype-style': 'off',
    'no-implicit-close': 'off',
  },
  elements: [
    'html5',
    {
      pv: { flow: true, phrasing: true },
    },
  ],
}

const htmlValidator = new HtmlValidate(validatorConfig)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// --- FIX LOGIC (Pure) ---

const pipe = <T>(val: T, ...fns: ((x: T) => T)[]): T => fns.reduce((acc, fn) => fn(acc), val)

const fixGenericTruncatedClosingTags = (s: string): string => s.replace(/<\/(\w+)\s*$/i, '</$1>')

const fixGenericTruncatedOpeningTags = (s: string): string => s.replace(/<(\w+)\s*$/i, '<$1>')

const fixTruncatedAttributes = (s: string): string => {
  const quoted = s.match(/<A\s+[^>]*href=(['"])((?:(?!\1).)*)$/i)
  if (quoted) return s + quoted[1] + '></a>'
  if (/<A\s+[^>]*href=[^>"'\s]*$/i.test(s)) return s + '></a>'
  return s
}

const fixEntities = (s: string): string => s.replace(/&nbsp;/g, ' ')

const fixTruncatedOpeningTagsAtEnd = (s: string): string => s.replace(/<(\w+)(\s+[^>]*)?$/i, '<$1$2>')

const fixHtmlContent = (html: string | undefined): string => {
  if (!html) return ''
  return pipe(
    html.trim(),
    fixGenericTruncatedClosingTags,
    fixGenericTruncatedOpeningTags,
    fixTruncatedOpeningTagsAtEnd,
    fixTruncatedAttributes,
    fixEntities,
  )
}

// --- VALIDATION & DB ---

const validateHtml = async (html: string): Promise<string | undefined> => {
  try {
    const report = await htmlValidator.validateString(`<div id="root">${html}</div>`)
    if (report.valid) return undefined
    const criticalErrors = report.results[0]!.messages
    return criticalErrors.length > 0 ? criticalErrors.map(m => `[${m.ruleId}] ${m.message}`).join(' | ') : undefined
  } catch (e) {
    return `[Exception] ${String(e)}`
  }
}

const getTableRows = (db: Database, tableName: string): DictRow[] =>
  db.query(`SELECT rowid, Word, Desc FROM ${tableName}`).all() as DictRow[]

const processRow = async (row: DictRow): Promise<ProcessingResult> => {
  const fixedDesc = fixHtmlContent(row.Desc)
  const errorMsg = await validateHtml(fixedDesc)

  if (errorMsg) {
    return {
      kind: 'error',
      error: {
        rowid: row.rowid,
        word: row.Word,
        original: row.Desc,
        autoFixed: fixedDesc,
        error: errorMsg,
      },
    }
  }

  if (fixedDesc !== row.Desc) {
    return { kind: 'update', update: { ...row, Desc: fixedDesc } }
  }

  return { kind: 'clean' }
}

const handleManualFix = async (err: ProcessingError): Promise<UpdateOp | null> => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`❌ VALIDATION ERROR`)
  console.log(`ID: ${err.rowid} | Word: ${err.word}`)
  console.log(`Error: ${err.error}`)
  console.log(`\n[AUTO-FIXED VERSION]:\n${err.autoFixed}`)
  console.log(`${'='.repeat(60)}`)

  while (true) {
    console.log(`\nEnter manual fix (or press Enter to use auto-fix, or type 'skip' to ignore this row):`)
    const input = await rl.question('> ')

    if (input.toLowerCase() === 'skip') return null

    const finalCandidate = input.trim() === '' ? err.autoFixed : input.trim()
    const newError = await validateHtml(finalCandidate)

    if (!newError) {
      console.log('✅ Validated!')
      return { rowid: err.rowid, Word: err.word, Desc: finalCandidate }
    }

    console.log(`\n❌ STILL INVALID: ${newError}`)
    console.log(`Your current draft: ${finalCandidate}`)
  }
}

const commitUpdates = (db: Database, tableName: string, updates: DictRow[]): void => {
  if (updates.length === 0) return

  console.log(`\n✅ Applying ${updates.length} fixes to ${tableName}...`)
  const transaction = db.transaction((items: DictRow[]) => {
    const updateStmt = db.prepare(`UPDATE ${tableName} SET Desc = $Desc WHERE rowid = $rowid`)
    const cacheStmt = db.prepare(
      'INSERT OR REPLACE INTO _validation_cache (table_name, row_id, content_hash) VALUES (?, ?, ?)',
    )

    items.forEach(item => {
      updateStmt.run({ $Desc: item.Desc, $rowid: item.rowid })
      cacheStmt.run(tableName, item.rowid, Bun.hash(item.Desc) as number)
    })
  })

  transaction(updates)
}

const runTable = async (db: Database, tableName: string): Promise<void> => {
  console.log(`\n--- Processing Table: ${tableName} ---`)

  const rows = getTableRows(db, tableName)
  console.log(`Total rows: ${rows.length}`)

  const results: ProcessingResult[] = []
  const chunkSize = 2000

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const chunkResults = await Promise.all(chunk.map(processRow))
    results.push(...chunkResults)
    process.stdout.write(`\rScanned ${Math.min(i + chunkSize, rows.length)} / ${rows.length}...`)
  }
  process.stdout.write('\n')

  const errors = results.filter((r): r is { kind: 'error'; error: ProcessingError } => r.kind === 'error')
  const updates = results
    .filter((r): r is { kind: 'update'; update: UpdateOp } => r.kind === 'update')
    .map(r => r.update)

  console.log(`Stats: Automatic Updates: ${updates.length}, Validation Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log(`\n--- Starting Manual Intervention for ${errors.length} errors ---`)
    for (const err of errors) {
      const manualUpdate = await handleManualFix(err.error)
      if (manualUpdate) {
        updates.push(manualUpdate)
      }
    }
  }

  if (updates.length > 0) {
    const confirm = await rl.question(`\nApply ${updates.length} changes to ${tableName}? (y/n): `)
    if (confirm.toLowerCase() === 'y') {
      commitUpdates(db, tableName, updates)
      console.log(`Updates committed to ${tableName}.`)
    } else {
      console.log('Changes discarded.')
    }
  }
}

// --- MAIN ---

;(async () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error('No DB found')
    process.exit(1)
  }

  const db = new Database(DB_PATH)

  try {
    // Ensure cache table exists if you still use it in commitUpdates
    db.run(
      `CREATE TABLE IF NOT EXISTS _validation_cache (table_name TEXT, row_id INTEGER, content_hash INTEGER, PRIMARY KEY (table_name, row_id))`,
    )

    for (const tableName of ['en_km_tbl_Dict', 'km_en_tbl_Dict']) {
      await runTable(db, tableName)
    }
    console.log('\nDone.')
  } catch (e) {
    console.error(e)
  } finally {
    db.close()
    rl.close()
  }
})()
