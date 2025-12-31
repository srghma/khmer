import { Database } from 'bun:sqlite'
import * as path from 'path'
import fs from 'fs'
import { HtmlValidate, type ConfigData } from 'html-validate'
import { format } from 'prettier' // Pretty print for error logs

// --- 1. CONFIGURATION ---

const CONFIG = {
  // ⚠️ Apply changes to the actual dict.db?
  WRITE_TO_DB: true,

  // ⚠️ Run strict HTML validation (structure, closing tags)?
  VALIDATE_HTML: true,

  // ⚠️ Crash and stop the script immediately if ANY entry is invalid?
  STOP_ON_ERROR: true,
}

const DICT_DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'
const CACHE_DB_PATH = path.join(
  process.env.XDG_CACHE_HOME || `${process.env.HOME}/.cache`,
  'my-translate-srt-files-cache.sqlite',
)
const REPORT_FILE_PATH = 'wiktionary_report.html'

// HTML Validator Configuration
const validatorConfig: ConfigData = {
  extends: [],
  rules: {
    'close-order': 'error', // Fails on </div> without <div>
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

// --- 2. TRANSFORMATION LOGIC ---

const transformHtml = (html: string): string => {
  if (!html) return ''

  // A. PRE-CLEANING (Critical for Regex anchors)
  // Remove BOM, ZWSP, and Trim whitespace
  let processed = html.replace(/[\uFEFF\u200B]/g, '').trim()

  // B. REMOVE SCRAPER ARTIFACTS (Manual Loop)
  // Robustly remove leading </div> tags that regex might miss
  // This loop handles multiple nested closing divs if they exist
  while (processed.toLowerCase().startsWith('</div>')) {
    processed = processed.substring(6).trim()
  }

  // C. REGEX CLEANING
  processed = processed
    // Remove Comments
    .replace(/<!--[\s\S]*?-->/g, '')

    // Remove Metadata & Scripts
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')

    // Remove Wiktionary Clutter
    .replace(/<div[^>]*class="printfooter"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id="catlinks"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id="mw-hidden-catlinks"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id="siteSub"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*id="contentSub"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="mw-indicators"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="vector-body-before-content"[^>]*>[\s\S]*?<\/div>/gi, '')

    // Remove [edit] Links
    .replace(/<a[^>]*title="Edit section[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<span[^>]*class="mw-editsection-bracket"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span[^>]*class="mw-editsection"[^>]*>[\s\S]*?<\/span>/gi, '')

    // Remove empty divs created by deletions
    .replace(/<div[^>]*>\s*<\/div>/gi, '')

    // DB Constraints (Tabs/Newlines)
    .replace(/[\t\n\r]/g, ' ')

  // D. MINIFICATION
  // Remove space between tags: </div> <div -> </div><div
  processed = processed.replace(/>\s+</g, '><')

  // Collapse multiple spaces: "Hello    World" -> "Hello World"
  processed = processed.replace(/\s{2,}/g, ' ').trim()
  processed = processed.replace(/^<\/div>/, '')
  processed = processed.replace(/<\/div>$/, '')

  return processed
}

// --- 3. REPORT GENERATION ---

const generateReport = (rows: Array<{ word: string; before: string; after: string; status: string }>) => {
  console.log('📝 Generating HTML report...')
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Wiktionary Migration Report</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
        h1 { text-align: center; }
        .stats { text-align: center; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; background: white; table-layout: fixed; }
        th, td { border: 1px solid #ccc; padding: 10px; vertical-align: top; word-wrap: break-word; }
        th { background: #333; color: white; position: sticky; top: 0; z-index: 10; }
        .col-word { width: 10%; }
        .col-status { width: 10%; }
        .col-content { width: 40%; }
        .content-box { max-height: 400px; overflow-y: auto; border: 1px dashed #ddd; padding: 5px; font-size: 14px; }
        .status-ok { color: green; font-weight: bold; }
        .status-dry { color: blue; font-weight: bold; }
        .status-skip { color: orange; font-weight: bold; }
        .status-error { color: red; font-weight: bold; }
        .mw-heading { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #eee; }
        .Khmr { font-family: "Khmer OS", "Khmer OS Battambang", serif; font-size: 1.2em; }
    </style>
</head>
<body>
    <h1>Wiktionary Cleaning Report</h1>
    <div class="stats">
        Mode: ${CONFIG.WRITE_TO_DB ? '<span style="color:red">LIVE WRITE</span>' : '<span style="color:blue">DRY RUN</span>'} |
        Stop On Error: ${CONFIG.STOP_ON_ERROR} |
        Entries Processed: ${rows.length}
    </div>
    <table>
        <thead>
            <tr>
                <th class="col-word">Word</th>
                <th class="col-status">Status</th>
                <th class="col-content">Before (Raw)</th>
                <th class="col-content">After (Cleaned)</th>
            </tr>
        </thead>
        <tbody>
            ${rows
              .map(
                row => `
            <tr>
                <td><strong>${row.word}</strong></td>
                <td class="${
                  row.status === 'UPDATED'
                    ? 'status-ok'
                    : row.status.includes('DRY RUN')
                      ? 'status-dry'
                      : row.status.includes('SKIP')
                        ? 'status-skip'
                        : 'status-error'
                }">${row.status}</td>
                <td><div class="content-box">${row.before}</div></td>
                <td><div class="content-box">${row.after}</div></td>
            </tr>`,
              )
              .join('')}
        </tbody>
    </table>
</body>
</html>`
  fs.writeFileSync(REPORT_FILE_PATH, htmlContent)
  console.log(`✅ Report saved to: ${path.resolve(REPORT_FILE_PATH)}`)
}

// --- 4. MAIN MIGRATION LOGIC ---

const migrate = async () => {
  console.log('🏁 Starting Migration Script')
  console.log('⚙️  Config:', CONFIG)

  if (!fs.existsSync(DICT_DB_PATH)) throw new Error('Dict DB not found')
  if (!fs.existsSync(CACHE_DB_PATH)) throw new Error('Cache DB not found')

  const dictDb = new Database(DICT_DB_PATH)
  const cacheDb = new Database(CACHE_DB_PATH)

  const reportRows: Array<{ word: string; before: string; after: string; status: string }> = []
  const validEntriesToUpdate: Array<{ word: string; html: string }> = []

  try {
    // 1. Fetch Data
    console.log('🔍 Fetching data from cache...')
    const cachedEntries = cacheDb.query('SELECT word, html FROM wiktionary_entries WHERE status = 200').all() as {
      word: string
      html: string
    }[]
    console.log(`🚀 Processing ${cachedEntries.length} entries...`)

    // 2. Process & Validate Loop (Outside Transaction)
    for (const entry of cachedEntries) {
      const word = entry.word
      const originalHtml = entry.html
      let status = 'PENDING'
      let cleanedHtml = ''
      let errorReason = ''

      try {
        cleanedHtml = transformHtml(originalHtml)

        // Basic Checks
        if (!cleanedHtml || cleanedHtml.length === 0) {
          errorReason = 'Result is empty string'
          status = 'SKIP: EMPTY'
        } else if (cleanedHtml === word) {
          errorReason = 'Result equals Word'
          status = 'SKIP: EQUALS WORD'
        } else if (cleanedHtml.includes('  ') || cleanedHtml.includes('\t')) {
          errorReason = 'Contains double spaces or tabs'
          status = 'SKIP: WHITESPACE ERR'
        }
        // HTML Validation
        else if (CONFIG.VALIDATE_HTML) {
          const report = await htmlValidator.validateString(cleanedHtml)
          if (!report.valid) {
            const msg = report.results[0]?.messages[0]?.message || 'Unknown HTML error'
            // PRETTY PRINTING THE ERROR SNIPPET
            const prettyHtml = await format(cleanedHtml, { parser: 'html' })
            errorReason = `Invalid HTML: ${msg}\n\n[Snippet]:\n${prettyHtml}`
            status = 'SKIP: INVALID HTML'
          }
        }

        // Logic Decision
        if (status !== 'PENDING') {
          // It failed one of the checks above
          if (CONFIG.STOP_ON_ERROR) {
            reportRows.push({ word, before: originalHtml, after: cleanedHtml, status: `FATAL: ${status}` })
            throw new Error(`STOP_ON_ERROR for word "${word}": ${errorReason}`)
          }
        } else {
          // Success
          status = CONFIG.WRITE_TO_DB ? 'UPDATED' : 'DRY RUN: VALID'
          validEntriesToUpdate.push({ word, html: cleanedHtml })
        }
      } catch (e: any) {
        if (e.message.includes('STOP_ON_ERROR')) throw e
        status = `ERROR: ${e.message}`
        if (CONFIG.STOP_ON_ERROR) {
          reportRows.push({ word, before: originalHtml, after: cleanedHtml, status: `FATAL: ${status}` })
          throw new Error(`STOP_ON_ERROR for word "${word}": ${e.message}`)
        }
      }

      reportRows.push({
        word,
        before: originalHtml,
        after: cleanedHtml,
        status,
      })
    } // End Loop

    // 3. Database Write Transaction
    if (CONFIG.WRITE_TO_DB && validEntriesToUpdate.length > 0) {
      console.log(`💾 Writing ${validEntriesToUpdate.length} valid entries to DB...`)

      // Add Column if missing
      const tableInfo = dictDb.query('PRAGMA table_info(km_Dict)').all() as { name: string }[]
      if (!tableInfo.some(col => col.name === 'Wiktionary')) {
        console.log("➕ Adding column 'Wiktionary'...")
        dictDb.run('ALTER TABLE km_Dict ADD COLUMN Wiktionary TEXT')
      }

      const updateStmt = dictDb.prepare('UPDATE km_Dict SET Wiktionary = $html WHERE Word = $word')

      const transaction = dictDb.transaction(entries => {
        let count = 0
        for (const entry of entries) {
          const info = updateStmt.run({ $html: entry.html, $word: entry.word })
          if (info.changes > 0) count++
        }
        return count
      })

      const writtenCount = transaction(validEntriesToUpdate)
      console.log(`✅ Database Updated: ${writtenCount} rows modified.`)

      console.log('🧹 Optimizing DB...')
      dictDb.run('VACUUM;')
    } else {
      console.log(`ℹ️  Dry Run: ${validEntriesToUpdate.length} valid entries found (No DB changes).`)
    }
  } catch (err: any) {
    console.error('❌ MIGRATION STOPPED:', err.message)
    // Optional: Log the pretty printed HTML if it's inside the error message
    if (err.message.includes('[Snippet]:')) {
      console.error('---------------------------------------------------')
      console.error(err.message.split('[Snippet]:')[1])
      console.error('---------------------------------------------------')
    }
  } finally {
    if (reportRows.length > 0) generateReport(reportRows)
    dictDb.close()
    cacheDb.close()
  }
}

migrate()
