import { Database } from 'bun:sqlite'
import { HtmlValidate, type ConfigData } from 'html-validate'
import fs from 'node:fs'
import { assertIsDefinedAndReturn } from './utils/asserts'

// --- TYPES ---

type DictRow = {
  readonly rowid: number
  readonly Word: string
  readonly WordDisplay: string
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

type CacheEntry = {
  table: string
  word: string
  original: string
  fixed: string
}

// --- CONFIG ---

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'
const CACHE_PATH = './word_display_manual_fixes.jsonl'

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
  elements: ['html5', { pv: { flow: true, phrasing: true } }],
}

const htmlValidator = new HtmlValidate(validatorConfig)

// --- CACHE LOGIC ---

const manualFixCache = new Map<string, string>()

const getCacheKey = (table: string, word: string, original: string) => `${table}||${word}||${original}`

const loadCache = () => {
  if (!fs.existsSync(CACHE_PATH)) return
  const lines = fs.readFileSync(CACHE_PATH, 'utf-8').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const entry: CacheEntry = JSON.parse(line)
      manualFixCache.set(getCacheKey(entry.table, entry.word, entry.original), entry.fixed)
    } catch (e) {}
  }
  console.log(`📦 Loaded ${manualFixCache.size} manual fixes from cache.`)
}

// --- FIX LOGIC (Pure) ---

const pipe = <T>(val: T, ...fns: ((x: T) => T)[]): T => fns.reduce((acc, fn) => fn(acc), val)

const downcaseFontTags = (s: string): string => {
  return s.replace(/<FONT(\s+[^>]*)?>/gi, match => match.toLowerCase()).replace(/<\/FONT>/gi, '</font>')
}

const mergeConsecutiveFonts = (s: string): string => {
  let prev
  let current = s
  do {
    prev = current
    current = current.replace(
      /<font\s+([^>]+)>([\s\S]*?)<\/font>\s*<font\s+\1>([\s\S]*?)<\/font>/g,
      '<font $1>$2$3</font>',
    )
  } while (current !== prev)
  return current
}

const fixMalformedBoldStart = (s: string): string => (s.startsWith('b>') ? '<' + s : s)
const fixGenericTruncatedClosingTags = (s: string): string => s.replace(/<\/(\w+)\s*$/i, '</$1>')
const fixGenericTruncatedOpeningTags = (s: string): string => s.replace(/<(\w+)\s*$/i, '<$1>')
const fixEntities = (s: string): string => s.replace(/&nbsp;/g, ' ')
const clearRedundantBold = (s: string, word: string): string => {
  const normalized = s.toLowerCase().trim()
  const redundant = `<b>${word.toLowerCase().trim()}</b>`
  return normalized === redundant ? '' : s
}

const replacementMap: Record<string, string> = {
  '<b>go ape (or <font color=#000099>N. Amer.</font>': 'go ape <font color=#000099>N. Amer.</font>',
  '<b>hum and haw (or': '',
  '<b>a</b>) free rein': '(<b>a</b>) free rein',
} as const

const fixWordDisplayContent = (display: string | undefined, word: string): string => {
  if (!display) return ''
  return pipe(
    display.trim().replace(/<<font /g, '<font '),
    downcaseFontTags,
    fixMalformedBoldStart,
    s => {
      const stripped = s.replace(/^<b>(.*)<\/b>$/i, '$1')
      if (stripped.toLowerCase() === word.toLowerCase()) return ''
      if (stripped.toLowerCase() === word.slice(1).toLowerCase()) return ''
      return stripped
    },
    s => {
      // Adjusted regex to allow an optional leading hyphen (-)
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp('^([-]?' + escapedWord + ')[^<]{1,3}(<font)', 'i')
      return s.replace(regex, '$1<BR>$2')
    },
    fixGenericTruncatedClosingTags,
    fixGenericTruncatedOpeningTags,
    mergeConsecutiveFonts,
    fixEntities,
    s => clearRedundantBold(s, word),
    s => {
      if (replacementMap.hasOwnProperty(s)) return assertIsDefinedAndReturn(replacementMap[s])
      return s
    },
  )
}

// --- VALIDATION & DB ---

const validateHtml = async (html: string): Promise<string | undefined> => {
  if (!html) return undefined
  try {
    const report = await htmlValidator.validateString(`<div id="root">${html}</div>`)
    if (report.valid) return undefined
    return report.results[0]!.messages.map(m => `[${m.ruleId}] ${m.message}`).join(' | ')
  } catch (e) {
    return `[Exception] ${String(e)}`
  }
}

const processRow = async (row: DictRow): Promise<ProcessingResult> => {
  if (!row.WordDisplay || !row.WordDisplay.trim()) return { kind: 'skipped' }

  const fixedWD = fixWordDisplayContent(row.WordDisplay, row.Word)
  const errorMsg = await validateHtml(fixedWD)

  if (errorMsg) {
    return {
      kind: 'error',
      error: {
        rowid: row.rowid,
        word: row.Word,
        original: row.WordDisplay,
        autoFixed: fixedWD,
        error: errorMsg,
      },
    }
  }

  if (fixedWD !== row.WordDisplay) {
    return { kind: 'update', update: { ...row, WordDisplay: fixedWD } }
  }

  return { kind: 'clean' }
}

const logValidationError = (tableName: string, err: ProcessingError) => {
  console.error(`\n${'='.repeat(40)}`)
  console.error(`❌ HTML ERROR: ${tableName} | Word: "${err.word}" (ID: ${err.rowid})`)
  console.error(`Original: "${err.original}"`)
  if (err.autoFixed !== err.original) console.error(`Auto-Fixed: "${err.autoFixed}"`)
  console.error(`Errors: ${err.error}`)
  console.error(`${'='.repeat(40)}`)
}

const columnExists = (db: Database, tableName: string, columnName: string): boolean => {
  const info = db.query(`PRAGMA table_info(${tableName})`).all() as {
    name: string
  }[]
  return info.some(col => col.name.toLowerCase() === columnName.toLowerCase())
}

const runTable = async (db: Database, tableName: string): Promise<void> => {
  console.log(`\n--- Processing Table: ${tableName} ---`)

  if (!columnExists(db, tableName, 'WordDisplay')) {
    console.log(`⚠️  Skipping: Column "WordDisplay" not found in table "${tableName}".`)
    return
  }

  const rows = db.query(`SELECT rowid, Word, WordDisplay FROM ${tableName}`).all() as DictRow[]
  console.log(`Total rows: ${rows.length}`)

  const results: ProcessingResult[] = []
  for (let i = 0; i < rows.length; i += 2000) {
    const chunk = rows.slice(i, i + 2000)
    results.push(...(await Promise.all(chunk.map(processRow))))
    process.stdout.write(`\rScanned ${Math.min(i + 2000, rows.length)} / ${rows.length}...`)
  }

  const errors = results.filter((r): r is { kind: 'error'; error: ProcessingError } => r.kind === 'error')
  const updates = results
    .filter((r): r is { kind: 'update'; update: UpdateOp } => r.kind === 'update')
    .map(r => r.update)

  let cacheHitCount = 0
  if (errors.length > 0) {
    for (const err of errors) {
      const e = err.error
      const cachedFix = manualFixCache.get(getCacheKey(tableName, e.word, e.original))
      if (cachedFix !== undefined) {
        updates.push({ rowid: e.rowid, Word: e.word, WordDisplay: cachedFix })
        cacheHitCount++
      } else {
        logValidationError(tableName, e)
      }
    }
  }

  console.log(`\nSummary for ${tableName}: Updates: ${updates.length}`)

  if (updates.length > 0) {
    // PRINT ALL UPDATES
    updates.forEach(upd => {
      const orig = rows.find(r => r.rowid === upd.rowid)?.WordDisplay
      console.log(`📝 [ID: ${upd.rowid}] "${upd.Word}": "${orig}" -> "${upd.WordDisplay}"`)
    })

    console.log(`✅ Committing ${updates.length} updates...`)
    const transaction = db.transaction((items: DictRow[]) => {
      const stmt = db.prepare(`UPDATE ${tableName} SET WordDisplay = $WD WHERE rowid = $rowid`)
      items.forEach(item => stmt.run({ $WD: item.WordDisplay, $rowid: item.rowid }))
    })
    transaction(updates)
  }
}

;(async () => {
  loadCache()
  const db = new Database(DB_PATH)
  try {
    for (const table of ['en_km_tbl_Dict', 'km_en_tbl_Dict']) {
      await runTable(db, table)
    }
    console.log('\nDone.')
  } finally {
    db.close()
  }
})()
