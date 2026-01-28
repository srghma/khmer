import { Database } from 'bun:sqlite'
import * as fs from 'fs'
import chalk from 'chalk'
import { khnormal } from 'khmer-normalizer'

// --- 1. TYPES & CONFIG ---

const CONFIG = {
  // 1. Apply pure renames? (Target Word does NOT exist in DB)
  WRITE_RENAMES: true,

  // 2. Apply safe merges? (Target Word EXISTS, but data is non-conflicting)
  WRITE_MERGES: true,

  STOP_ON_CLASH: true,
}

const DICT_DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'
const REPORT_FILE = 'report_fix_qaq_combined.html'

// The specific columns we care about
const DATA_KEYS = [
  'Desc',
  'Phonetic',
  'Wiktionary',
  'from_csv_variants',
  'from_csv_nounForms',
  'from_csv_pronunciations',
  'from_csv_rawHtml',
  'from_chuon_nath',
  'from_chuon_nath_translated',
  'from_russian_wiki',
  'en_km_com',
] as const

type DataKey = (typeof DATA_KEYS)[number]

type Row = {
  Word: string
} & { [K in DataKey]: string | null }

// --- 2. FUNCTIONAL MERGE LOGIC ---

type MergeResult = { type: 'success'; mergedRow: Row } | { type: 'error'; reason: string }

const cleanVal = (v: any): string | null => (v === null || v === undefined || v === '' ? null : String(v))

const mergeField = (key: string, valA: string | null, valB: string | null): { val: string | null; error?: string } => {
  const a = cleanVal(valA)
  const b = cleanVal(valB)

  if (a && b && a !== b) {
    // Both exist and are different -> Clash
    return { val: null, error: `<b>${key}</b>: "${a.slice(0, 20)}..." ≠ "${b.slice(0, 20)}..."` }
  }

  // If equal, or one is null, return the best one
  return { val: a ?? b ?? null }
}

const attemptMerge = (source: Row, target: Row): MergeResult => {
  const merged: any = { Word: target.Word } // Always take target word
  const errors: string[] = []

  for (const key of DATA_KEYS) {
    const res = mergeField(key, source[key], target[key])
    if (res.error) {
      errors.push(res.error)
    } else {
      merged[key] = res.val
    }
  }

  if (errors.length > 0) {
    return { type: 'error', reason: errors.join(', ') }
  }

  return { type: 'success', mergedRow: merged as Row }
}

// --- 3. REPORTING ---

interface ReportEntry {
  oldWord: string
  newWord: string
  khDiff: string
  sourceRow: Row
  targetRow: Row | null // Null if pure rename
  mergedRow?: Row // Only for merges
  note?: string
}

const formatObj = (obj: any, highlightKeys: string[] = []) => {
  if (!obj) return '<span style="color:#ccc">Null</span>'
  const clean = Object.fromEntries(Object.entries(obj).filter(([_, v]) => cleanVal(v) !== null))
  if (Object.keys(clean).length === 0) return '<em style="color:#999">Empty</em>'

  // Simple JSON stringify, but arguably a custom HTML table for the object is better for "diffing"
  return `<pre style="white-space: pre-wrap; margin: 0; font-size: 10px; color:#444">${JSON.stringify(clean, null, 2)}</pre>`
}

const generateCombinedReport = (
  filename: string,
  renames: ReportEntry[],
  merges: ReportEntry[],
  clashes: ReportEntry[],
) => {
  const total = renames.length + merges.length + clashes.length
  if (total === 0) return

  const renderTable = (entries: ReportEntry[], type: 'rename' | 'merge' | 'clash') => {
    if (entries.length === 0) return '<p>No entries.</p>'

    return `
    <table>
      <thead>
        <tr>
          <th style="width:15%">Word Change</th>
          <th style="width:10%">Normalizer</th>
          <th style="width:25%">Source Data</th>
          <th style="width:25%">${type === 'merge' ? 'Target Data (Will Delete)' : 'Target Data'}</th>
          <th style="width:25%">${type === 'merge' ? 'Resulting Data' : 'Notes/Error'}</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map(
            r => `
          <tr>
            <td class="word-cell">
              <div class="old">${r.oldWord.replace(/\u17A3/g, '<span style="background:#ffcccc">\u17A3</span>')}</div>
              <div class="arrow">↓</div>
              <div class="new">${r.newWord.replace(/\u17A2/g, '<span style="background:#ccffcc">\u17A2</span>')}</div>
            </td>
            <td style="font-size:0.8em; color:#666">${r.khDiff || '-'}</td>
            <td>${formatObj(r.sourceRow)}</td>
            <td>${formatObj(r.targetRow)}</td>
            <td>
              ${r.note ? `<div class="error">${r.note}</div>` : ''}
              ${r.mergedRow ? `<div style="color:blue; font-weight:bold">Merged Result:</div>${formatObj(r.mergedRow)}` : ''}
            </td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>`
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Khmer QAQ Fix Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f0f2f5; }
    h1 { text-align: center; color: #333; }
    .stats { text-align: center; margin-bottom: 30px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section { margin-bottom: 40px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h2 { margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9em; table-layout: fixed; }
    th, td { border: 1px solid #eee; padding: 8px; vertical-align: top; word-wrap: break-word; }
    th { background: #f8f9fa; text-align: left; }
    .word-cell { text-align: center; font-family: "Khmer OS Battambang"; font-size: 1.1em; }
    .old { color: #d63384; text-decoration: line-through; }
    .new { color: #198754; font-weight: bold; }
    .arrow { color: #999; font-size: 0.8em; }
    .error { color: #dc3545; font-weight: bold; background: #fff5f5; padding: 5px; border-radius: 4px; border: 1px solid #ffc9c9; }
    pre { background: #f8f9fa; padding: 5px; border-radius: 4px; border: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <h1>Deprecated ឣ Fixer Report</h1>
  <div class="stats">
    RENAMES (Safe): <b>${renames.length}</b> (Mode: ${CONFIG.WRITE_RENAMES ? '🔴 LIVE' : '🔵 DRY'}) |
    MERGES (Safe): <b>${merges.length}</b> (Mode: ${CONFIG.WRITE_MERGES ? '🔴 LIVE' : '🔵 DRY'}) |
    CLASHES: <b>${clashes.length}</b>
  </div>

  <div class="section">
    <h2 style="color: #d63384">❌ Clashes (${clashes.length})</h2>
    <p>Target exists and has conflicting data.</p>
    ${renderTable(clashes, 'clash')}
  </div>

  <div class="section">
    <h2 style="color: #0d6efd">⚡ Safe Merges (${merges.length})</h2>
    <p>Target exists, but data can be combined without loss.</p>
    ${renderTable(merges, 'merge')}
  </div>

  <div class="section">
    <h2 style="color: #198754">✅ Safe Renames (${renames.length})</h2>
    <p>Target word is free.</p>
    ${renderTable(renames, 'rename')}
  </div>
</body>
</html>`

  fs.writeFileSync(filename, html)
  console.log(chalk.green(`📝 Report saved to ${filename}`))
}

// --- 4. MAIN ---

const run = () => {
  console.log(chalk.blue('🏁 Starting Deprecated QAQ (ឣ -> អ) Fixer'))
  const db = new Database(DICT_DB_PATH)

  // Pre-compile checks
  const getTargetStmt = db.prepare('SELECT * FROM km_Dict WHERE Word = ?')

  try {
    // 1. Indexing
    console.log('🔍 Indexing existing words...')
    const allExistingWords = new Set<string>()
    db.query('SELECT Word FROM km_Dict')
      .all()
      .forEach((r: any) => allExistingWords.add(r.Word))

    // 2. Fetch Candidates
    // CHANGED: Find any word containing \u17A3 (not just starting with)
    const candidates = db.query(`SELECT * FROM km_Dict WHERE Word LIKE '%\u17A3%'`).all() as Row[]
    console.log(`🚀 Found ${candidates.length} candidates containing ឣ.`)

    const renames: ReportEntry[] = []
    const merges: ReportEntry[] = []
    const clashes: ReportEntry[] = []

    // 3. Analysis Loop
    for (const sourceRow of candidates) {
      const oldWord = sourceRow.Word

      // CHANGED: Ignore if the word is ONLY the deprecated character itself
      if (oldWord === '\u17A3') continue

      // CHANGED: Replace ALL occurrences of ឣ (\u17A3) with អ (\u17A2)
      const newWord = oldWord.replace(/\u17A3/g, '\u17A2')

      if (newWord === oldWord) continue

      // Diff Helper
      let khDiff = ''
      try {
        const nDef = khnormal(oldWord)
        if (nDef !== newWord) khDiff = `Def: ${nDef}`
      } catch (e) {
        khDiff = 'Err'
      }

      if (allExistingWords.has(newWord)) {
        const targetRow = getTargetStmt.get(newWord) as Row | undefined

        if (!targetRow) {
          // Created in this run (Batch Clash)
          clashes.push({
            oldWord,
            newWord,
            khDiff,
            sourceRow,
            targetRow: null,
            note: 'BATCH CLASH: Target created in this run',
          })
        } else {
          // Attempt Merge
          const result = attemptMerge(sourceRow, targetRow)

          if (result.type === 'success') {
            merges.push({
              oldWord,
              newWord,
              khDiff,
              sourceRow,
              targetRow,
              mergedRow: result.mergedRow,
            })
          } else {
            clashes.push({
              oldWord,
              newWord,
              khDiff,
              sourceRow,
              targetRow,
              note: `CONFLICT: ${result.reason}`,
            })
          }
        }
      } else {
        // Safe Rename
        renames.push({ oldWord, newWord, khDiff, sourceRow, targetRow: null })
        allExistingWords.add(newWord)
      }
    }

    // 4. Report
    generateCombinedReport(REPORT_FILE, renames, merges, clashes)

    // 5. Execution
    const doRenames = CONFIG.WRITE_RENAMES && renames.length > 0
    const doMerges = CONFIG.WRITE_MERGES && merges.length > 0

    if (doRenames || doMerges) {
      console.log(chalk.yellow('\n💾 Writing changes to DB...'))

      const transaction = db.transaction(() => {
        let stats = { renames: 0, merges: 0 }

        // --- Execute Merges ---
        // 1. Delete Target (we have its data in memory)
        // 2. Update Source with MERGED data + NEW word
        if (doMerges) {
          const delStmt = db.prepare('DELETE FROM km_Dict WHERE Word = ?')
          // Build dynamic update query to set all fields
          const setClause = DATA_KEYS.map(k => `${k} = $${k}`).join(', ')
          const updateStmt = db.prepare(`UPDATE km_Dict SET Word = $newWord, ${setClause} WHERE Word = $oldWord`)

          for (const m of merges) {
            delStmt.run(m.newWord)

            const params: any = { $newWord: m.newWord, $oldWord: m.oldWord }
            DATA_KEYS.forEach(k => (params[`$${k}`] = m.mergedRow![k]))

            updateStmt.run(params)
            stats.merges++
          }
        }

        // --- Execute Renames ---
        // Simple update of Word column
        if (doRenames) {
          const updateStmt = db.prepare('UPDATE km_Dict SET Word = $newWord WHERE Word = $oldWord')
          for (const r of renames) {
            updateStmt.run({ $newWord: r.newWord, $oldWord: r.oldWord })
            stats.renames++
          }
        }

        return stats
      })

      const res = transaction()
      console.log(chalk.green(`✅ Done! Renames: ${res.renames}, Merges: ${res.merges}`))
      db.run('VACUUM;')
    } else {
      console.log(chalk.cyan('\nℹ️  Dry Run. Check HTML report.'))
    }
  } catch (e) {
    console.error(e)
  } finally {
    db.close()
  }
}

run()
