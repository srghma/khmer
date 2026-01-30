import { Database } from 'bun:sqlite'
import fs from 'node:fs'

// --- CONFIGURATION ---
const CONFIG = {
  jsonPath: '/home/srghma/projects/en_Dict_en_km_com_assets_images_png/ocr_results.json',
  dbPath: '/home/srghma/projects/khmer/srghmakhmerdict/src-tauri/dict.db',
  tableName: 'en_km_com_ocr',
}

// Regex to validate Khmer in JS before sending to DB (Double safety)
// Range: \u1780-\u17FF (Khmer) and \u19E0-\u19FF (Khmer Symbols)
const KHMER_REGEX = /^[\p{Script=Khmer}\s,\(\)\.:\-!\d\/?a-zA-Z=\[\]]+$/u

async function main() {
  console.log(`🚀 Starting Migration...`)

  // 1. Load JSON
  if (!fs.existsSync(CONFIG.jsonPath)) {
    throw new Error(`JSON file not found: ${CONFIG.jsonPath}`)
  }
  console.log(`📂 Reading JSON: ${CONFIG.jsonPath}`)
  const jsonData = JSON.parse(fs.readFileSync(CONFIG.jsonPath, 'utf8')) as Record<string, string>

  // 2. Open DB
  const db = new Database(CONFIG.dbPath)
  console.log(`📂 Connected to DB: ${CONFIG.dbPath}`)

  // 3. Create Table
  // Constraints:
  // - PK is integer
  // - text not null, not empty, trimmed
  // - contains khmer (Checking Hex headers E19E... and E19F... covers the standard Khmer UTF-8 block)
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "${CONFIG.tableName}" (
      "id" INTEGER NOT NULL PRIMARY KEY,
      "text" TEXT NOT NULL CHECK(
          "text" != '' AND
          "text" = TRIM("text") AND
          "text" NOT LIKE '%  %' AND
          (hex("text") LIKE '%E19E%' OR hex("text") LIKE '%E19F%')
      )
    );
  `
  db.run(createTableQuery)
  console.log(`✅ Table '${CONFIG.tableName}' ensured.`)

  // 4. Prepare Insert
  const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${CONFIG.tableName}" (id, text) VALUES ($id, $text)`)

  let successCount = 0
  let skippedCount = 0

  // 5. Transaction Loop
  const performMigration = db.transaction(() => {
    for (const [key, rawText] of Object.entries(jsonData)) {
      const id = parseInt(key, 10)
      let text = rawText ? rawText.trim() : ''

      // Skip invalid entries logic
      if (!text || text === 'EMPTY_IMAGE') {
        skippedCount++
        continue
      }

      // Check for Khmer characters (JS Logic)
      if (!KHMER_REGEX.test(text)) {
        console.warn(`   ⚠️ [${id}] Skipped: Text has no Khmer characters. ("${text}")`)
        skippedCount++
        continue
      }

      try {
        insertStmt.run({ $id: id, $text: text })
        successCount++
      } catch (err: any) {
        // This might catch the SQL CHECK constraint violations if JS regex didn't catch it
        console.error(`   ❌ [${id}] DB Insert Failed: ${err.message}`)
        skippedCount++
      }
    }
  })

  console.log(`⏳ Inserting data...`)
  performMigration()

  console.log(`\n🎉 Done.`)
  console.log(`   Inserted/Updated: ${successCount}`)
  console.log(`   Skipped:          ${skippedCount}`)
}

main()
