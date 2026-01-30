import { Database } from 'bun:sqlite'
import { Window } from 'happy-dom'
import * as path from 'path'
import { DetailedReportStreamer } from './utils/duplicate-report-streamer'

// --- 1. CONFIGURATION ---
const CONFIG = {
  DB_PATH: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  REPORT_PATH: 'merge_conflict_report.html',
  CHUNK_SIZE: 4000,

  // ⚡ NEW CONFIG: If true, it updates rows to use the short-name webp HTML
  RUN_MIGRATION_FIX_IMAGES: false,
}

// Regex to find "Correct" rows (e.g. ".../1234.webp" or ".../123456.webp")
const CORRECT_IMG_REGEX = /\/en_Dict_en_km_com_assets_images\/\d{2,6}\.webp/

// --- 2. TYPES & USER LOGIC ---

type Row = {
  Word: string
  WordDisplay: string | null
  Desc: string | null
  Desc_en_only: string | null
  en_km_com: string | null
}

// --- 3. CLEANER ---
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

  getFingerprint(html: string | null): string {
    if (!html) return ''
    const preCleaned = html.replace(/[\uFEFF\u200B]/g, '').trim()
    this.doc.body.innerHTML = preCleaned
    // Remove content that usually differs (images, scripts) to find the semantic match
    const junk = this.doc.querySelectorAll('img, audio, script, style, link, meta')
    for (const el of junk) el.remove()
    return this.doc.body.innerHTML
      .replace(/[\t\n\r]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }
}

// --- 4. MAIN SCRIPT ---

async function run() {
  console.log('🚀 Starting Analysis...')
  console.log(`🛠  Migration Mode: ${CONFIG.RUN_MIGRATION_FIX_IMAGES ? 'ON (Writing to DB)' : 'OFF (Dry Run)'}`)

  const db = new Database(CONFIG.DB_PATH)
  const normalizer = new DefinitionNormalizer()
  const reporter = new DetailedReportStreamer(CONFIG.REPORT_PATH)

  try {
    const { count } = db.query('SELECT count(*) as count FROM en_Dict WHERE en_km_com IS NOT NULL').get() as {
      count: number
    }
    console.log(`📊 Rows: ${count}`)

    // 1. Grouping
    const groups = new Map<string, Row[]>()
    let offset = 0
    let processed = 0

    while (processed < count) {
      const chunk = db
        .query(`SELECT * FROM en_Dict WHERE en_km_com IS NOT NULL LIMIT ${CONFIG.CHUNK_SIZE} OFFSET ${offset}`)
        .all() as Row[]
      if (chunk.length === 0) break

      for (const row of chunk) {
        const fp = normalizer.getFingerprint(row.en_km_com)
        if (!fp) continue
        if (!groups.has(fp)) groups.set(fp, [])
        groups.get(fp)!.push(row)
      }
      processed += chunk.length
      offset += chunk.length
      process.stdout.write(`\rGrouping: ${processed}/${count}`)
    }

    console.log('\n✅ Grouping Done. Analyzing and Preparing Updates...')

    const updateOperations: { word: string; newHtml: string }[] = []
    let fixedGroupsCount = 0

    // 2. Analysis & Migration Prep
    for (const [fp, rows] of groups.entries()) {
      // We only care if there are potential duplicates/variants to fix
      if (rows.length < 2) continue

      // Strategy: Find a row that has the "Correct" image URL pattern
      const sourceRow = rows.find(r => r.en_km_com && CORRECT_IMG_REGEX.test(r.en_km_com))

      if (!sourceRow) {
        // No row in this group has the correct image format.
        // Report as skipped/ambiguous.
        reporter.writeItem({
          status: 'SKIPPED',
          fingerprint: fp,
          error: 'No valid source image (short .webp) found in group',
          rows: rows,
        })
        continue
      }

      // We found a source. Find rows that need updating.
      // A row needs updating if its HTML does not match the source HTML.
      const targetRows = rows.filter(r => r.en_km_com !== sourceRow.en_km_com)

      if (targetRows.length === 0) {
        // All rows already match the source exactly. No update needed.
        continue
      }

      // Queue updates
      if (CONFIG.RUN_MIGRATION_FIX_IMAGES) {
        for (const target of targetRows) {
          updateOperations.push({
            word: target.Word,
            newHtml: sourceRow.en_km_com!,
          })
        }
      }

      // Log to Report
      reporter.writeItem({
        status: 'SUCCESS', // We define "Success" here as "Found a fix"
        fingerprint: fp,
        error: `Migration: Updating ${targetRows.length} row(s) to match '${sourceRow.Word}'`,
        rows: [sourceRow, ...targetRows], // Source first, then targets
        analysis: {
          WordDisplay: { ok: true, msg: 'Fixing Image URL' },
          Desc: { ok: true, msg: 'Fixing Image URL' },
          Desc_en_only: { ok: true, msg: 'Fixing Image URL' },
        },
      })
      fixedGroupsCount++
    }

    // 3. Execution
    if (CONFIG.RUN_MIGRATION_FIX_IMAGES && updateOperations.length > 0) {
      console.log(`\n💾 Writing updates to database...`)
      console.log(`   Operations: ${updateOperations.length}`)
      console.log(`   Groups Affected: ${fixedGroupsCount}`)

      const updateStmt = db.prepare('UPDATE en_Dict SET en_km_com = $html WHERE Word = $word')

      const transaction = db.transaction(ops => {
        for (const op of ops) {
          updateStmt.run({ $html: op.newHtml, $word: op.word })
        }
      })

      transaction(updateOperations)
      console.log(`✅ Database updated successfully.`)

      console.log(`🧹 Vacuuming...`)
      db.run('VACUUM;')
    } else if (updateOperations.length > 0) {
      console.log(`\n🚧 DRY RUN: Found ${updateOperations.length} potential updates in ${fixedGroupsCount} groups.`)
    } else {
      console.log(`\n✨ No updates needed.`)
    }

    console.log(`\n🎉 Report generated at: ${path.resolve(CONFIG.REPORT_PATH)}`)
  } catch (e) {
    console.error(e)
  } finally {
    reporter.close()
    normalizer.free()
    db.close()
  }
}

run()
