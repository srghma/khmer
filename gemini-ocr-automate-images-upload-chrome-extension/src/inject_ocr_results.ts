#!/usr/bin/env bun
import { Database } from 'bun:sqlite'
import fs from 'node:fs'
import { Window } from 'happy-dom'
import { assertIsDefinedAndReturn } from './utils/asserts'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './utils/non-empty-string-trimmed'
import { unknownToNonNegativeIntOrThrow_strict, type ValidNonNegativeInt } from './utils/toNumber'

// --- CONFIGURATION ---
const CONFIG = {
  // SQLite Database Path
  dbPath: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',

  // JSON Output from the previous Tesseract script
  ocrJsonPath: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png/ocr_results.json',

  // Throw error if an image ID found in DB is missing from JSON or empty
  strictMode: true,

  // The column containing the HTML to scan
  tableName: 'en_Dict',
  targetColumn: 'en_km_com',
  idColumn: 'Word', // Used for identifying rows during update
}

async function main() {
  console.log(`🚀 Starting OCR Injection...`)

  // 1. Load and Validate JSON
  if (!fs.existsSync(CONFIG.ocrJsonPath)) {
    throw new Error(`JSON file not found: ${CONFIG.ocrJsonPath}`)
  }

  console.log(`📂 Loading JSON: ${CONFIG.ocrJsonPath}`)
  const ocrData_ = JSON.parse(fs.readFileSync(CONFIG.ocrJsonPath, 'utf8')) as Record<string, string>
  const ocrData: Map<ValidNonNegativeInt, NonEmptyStringTrimmed> = new Map()

  // Validate that no values in JSON are empty (as requested)
  for (const [id, text] of Object.entries(ocrData_)) {
    console.log(id, text)
    ocrData.set(unknownToNonNegativeIntOrThrow_strict(id), nonEmptyString_afterTrim(text))
  }
  console.log(`✅ JSON loaded and validated (${ocrData.size} entries).`)

  // 2. Open Database
  const db = new Database(CONFIG.dbPath)
  console.log(`📂 Database opened: ${CONFIG.dbPath}`)

  // 3. Fetch rows that actually contain images
  // We use the LIKE operator to filter only rows with <img> tags to save processing time
  const query = `SELECT ${CONFIG.idColumn}, ${CONFIG.targetColumn} FROM ${CONFIG.tableName} WHERE ${CONFIG.targetColumn} LIKE '%<img%'`
  const rows = db.query(query).all() as Array<{ [key: string]: string }>

  console.log(`🔍 Found ${rows.length} rows containing images. Processing...`)

  // Prepare Update Statement
  const updateStmt = db.prepare(
    `UPDATE ${CONFIG.tableName} SET ${CONFIG.targetColumn} = $html WHERE ${CONFIG.idColumn} = $id`,
  )

  // Happy DOM Setup
  const window = new Window()
  const document = window.document

  let updatedRows = 0
  let processedImages = 0

  db.transaction(() => {
    for (const row of rows) {
      const rowId = assertIsDefinedAndReturn(row[CONFIG.idColumn])
      const originalHtml = row[CONFIG.targetColumn]

      // Parse HTML
      document.body.innerHTML = assertIsDefinedAndReturn(originalHtml)
      const images = document.querySelectorAll('img')
      let rowModified = false

      for (const img of images) {
        const src = img.getAttribute('src')
        if (!src) continue

        // Extract ID from src (e.g., "1295.png" -> "1295")
        // Adjust regex if paths are complex (e.g., /assets/images/1295.png)
        const match = assertIsDefinedAndReturn(src.match(/(\d+)\.(png|webp)$/))

        const imageId = unknownToNonNegativeIntOrThrow_strict(assertIsDefinedAndReturn(match[1]))
        const translation = ocrData.get(imageId)

        // Check for existence
        if (!translation) {
          const errorMsg = `❌ Missing translation for Image ID: ${imageId} (Row: ${rowId})`
          if (CONFIG.strictMode) {
            throw new Error(errorMsg)
          } else {
            console.warn(errorMsg)
            continue
          }
        }

        processedImages++

        // Check if <span class="img-scan"> already exists immediately after
        const nextSibling = img.nextElementSibling

        if (nextSibling && nextSibling.tagName === 'SPAN' && nextSibling.classList.contains('img-scan')) {
          // Update existing if different
          if (nextSibling.textContent !== translation) {
            nextSibling.textContent = translation
            rowModified = true
          }
        } else {
          // Create new span
          const span = document.createElement('span')
          span.className = 'img-scan'
          span.textContent = translation

          // Insert after <img>
          // happy-dom/dom supports .after()
          img.after(span)
          rowModified = true
        }
      }

      // Only update DB if changes were made
      if (rowModified) {
        // serialize() or innerHTML retrieves the string
        const newHtml = document.body.innerHTML
        updateStmt.run({ $html: newHtml, $id: rowId })
        updatedRows++
        process.stdout.write('.') // Progress indicator
      }
    }
  })()

  console.log(`\n\n🎉 Done!`)
  console.log(`   Processed Images: ${processedImages}`)
  console.log(`   Updated Rows:     ${updatedRows}`)
}

if (import.meta.main) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
