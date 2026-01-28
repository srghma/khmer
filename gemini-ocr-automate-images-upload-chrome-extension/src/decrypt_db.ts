import { Database } from 'bun:sqlite'
import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'

// --- CONFIGURATION ---
// Change this path to process the other database
const DB_PATH = '/home/srghma/Downloads/en_km.db'
const TABLE_NAME = 'tbl_Dict'

// The Key (Shared by both DBs)
const KEY_HEX = 'a33d776b0aa30d060e3727fc5c94b9f4a8576ca1e5075687ccbf2f51ffbdffdc'
const KEY = Buffer.from(KEY_HEX, 'hex')

// --- DECRYPTION FUNCTION ---
function decrypt(encryptedBase64: string): string | null {
  if (!encryptedBase64 || encryptedBase64.trim() === '') return null

  try {
    const encryptedBytes = Buffer.from(encryptedBase64, 'base64')

    // 1. Sanity Check: AES blocks are always multiples of 16
    if (encryptedBytes.length % 16 !== 0) {
      return null // Not encrypted (or corrupt)
    }

    const decipher = crypto.createDecipheriv('aes-256-ecb', KEY, null)
    decipher.setAutoPadding(true)

    let decrypted = Buffer.concat([decipher.update(encryptedBytes), decipher.final()])

    const result = decrypted.toString('utf8')

    // 2. Content Check: If it doesn't look like text/html, maybe decryption failed silently
    // (Optional, but good for filtering garbage)
    if (!result.includes('<') && !result.includes(' ')) {
      // console.warn("Decrypted content looks suspicious:", result.slice(0, 20));
    }

    return result
  } catch (e) {
    return null // Decryption failed (Padding error = wrong key or not encrypted)
  }
}

// --- MAIN LOGIC ---

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at: ${DB_PATH}`)
  process.exit(1)
}

const db = new Database(DB_PATH)
console.log(`Opened Database: ${DB_PATH}`)

// 1. Create column
try {
  db.run(`ALTER TABLE ${TABLE_NAME} ADD COLUMN Desc_decoded TEXT;`)
  console.log("Column 'Desc_decoded' added.")
} catch (e) {
  console.log("Column 'Desc_decoded' already exists, updating...")
}

// 2. Count rows
const countResult = db.query(`SELECT COUNT(*) as count FROM ${TABLE_NAME}`).get() as { count: number }
const totalRows = countResult.count
console.log(`Total rows to process: ${totalRows}`)

// 3. Prepare Statements using 'rowid'
// 'rowid' is a hidden column present in almost all SQLite tables
const selectStmt = db.query(`SELECT rowid, Desc FROM ${TABLE_NAME}`)
const updateStmt = db.prepare(`UPDATE ${TABLE_NAME} SET Desc_decoded = ? WHERE rowid = ?`)

// 4. Batch Transaction
const updateTransaction = db.transaction((rows: any[]) => {
  for (const row of rows) {
    const decryptedText = decrypt(row.Desc)

    if (decryptedText) {
      updateStmt.run(decryptedText, row.rowid)
    }
  }
})

console.log('Starting decryption...')

const batchSize = 2000
let processed = 0
let successCount = 0 // Track how many actually worked
let batch = []

// Iterate
for (const row of selectStmt.all() as any[]) {
  // Try decrypt immediately to count success
  const decrypted = decrypt(row.Desc)

  if (decrypted) {
    successCount++
    // We pass the decrypted value to the batch so we don't decrypt twice
    // We create a temp object for the transaction function
    batch.push({ rowid: row.rowid, Desc: row.Desc })
  } else {
    // If decryption failed, we skip adding it to the batch update
  }

  if (batch.length >= batchSize) {
    // Note: We are re-decrypting inside the transaction function to keep code simple,
    // or we could pass the decrypted string.
    // Let's rely on the existing transaction logic which calls decrypt() again.
    // It's fast enough.
    updateTransaction(batch)
    processed += batch.length // This counts rows UPDATED
    batch = []
    process.stdout.write(`\rProgress: ${processed} updated...`)
  }
}

// Process remaining
if (batch.length > 0) {
  updateTransaction(batch)
  processed += batch.length
}

console.log(`\n\n✅ Done!`)
console.log(`Successful Decryptions: ${processed} / ${totalRows}`)
console.log(`Skipped (Already plain text or empty): ${totalRows - processed}`)
console.log(`Check content in: ${DB_PATH}`)

db.close()
