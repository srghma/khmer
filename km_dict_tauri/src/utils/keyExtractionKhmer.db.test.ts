import { describe, it, expect } from 'vitest'
import { Database } from 'bun:sqlite'
import fs from 'node:fs'
import { extractKeysKhmer, type KhmerInfo } from './keyExtractionKhmer'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { processDataKhmer } from './toGroupKhmer'

const DB_PATH = '/home/srghma/projects/khmer/km_dict_tauri/src-tauri/dict.db'

describe('extractKeysKhmer (Real DB)', () => {
  it('processes all words from km_Dict table without error', () => {
    if (!fs.existsSync(DB_PATH)) {
      console.warn(`Database file not found at ${DB_PATH}. Skipping DB test.`)

      return
    }

    console.log(`Connecting to database: ${DB_PATH}`)
    const db = new Database(DB_PATH, { readonly: true })

    // Check if table exists
    const tableCheck = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='km_Dict'").get()

    if (!tableCheck) throw new Error("Table 'km_Dict' does not exist in the database.")

    // Select all words
    const query = db.query('SELECT * FROM km_Dict')
    const rows = query.all() as { Word: string; Desc: string }[]

    console.log(`Testing ${rows.length} words from database...`)

    let failures = 0
    const failureSamples: string[] = []
    const success: [NonEmptyStringTrimmed, KhmerInfo][] = []

    for (const row of rows) {
      const word = String_toNonEmptyString_orUndefined_afterTrim(row.Word)

      if (!word) continue

      try {
        const result = extractKeysKhmer(word)

        success.push([word, result])
      } catch (error: any) {
        failures++
        if (failureSamples.length < 100) {
          failureSamples.push(`Word: "${word}" -> ${error.message}\n  ${JSON.stringify(row)}`)
        }
      }
    }

    if (failures > 0) {
      console.error(`\nFAILED: ${failures} words could not be parsed.`)
      console.error('Sample errors:')
      failureSamples.forEach(msg => console.error(msg))
    } else {
      console.log('SUCCESS: All words parsed successfully.')
    }

    expect(failures).toBe(0)

    processDataKhmer(success)
  })
})
