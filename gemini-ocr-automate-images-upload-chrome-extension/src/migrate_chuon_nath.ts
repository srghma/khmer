import { Database } from 'bun:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { openDB } from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/open-google-translate-cache.ts'
import { translateSrt } from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/open-google-translate-cached.ts'
import { translateWithRetryForever } from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/retry'
import {
  extractAbbreviationMap,
  expandAbbreviations,
  CONFIG,
} from '/home/srghma/projects/khmer/dicts/src/translate-dict.ts'
import { Set_toNonEmptySet_orThrow } from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/non-empty-set'
import { parseDictionaryFile } from '/home/srghma/projects/khmer/gemini-ocr-automate-images-upload-chrome-extension/src/utils/dict-parser'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './utils/non-empty-string-trimmed'

const DB_PATH = '/home/srghma/projects/khmer/khmer_dictionary/assets/dict.db'

/**
 * Strips HTML tags for translation context while preserving meaningful text
 */
const stripTagsForTranslation = (html: string): string =>
  html
    // .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, ' ')
    .trim()

const migrate = async () => {
  const inputPath = path.resolve(CONFIG.inputFile)
  if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`)

  const rawContent = fs.readFileSync(inputPath, 'utf-8')
  const abbrMap = extractAbbreviationMap(rawContent)
  const entries = parseDictionaryFile(rawContent)

  // Skip the legend/header entry
  const dataEntries = entries.slice(1)
  console.log(`📖 Parsed ${dataEntries.length} Chuon Nath entries.`)

  // 1. Prepare expanded Khmer content and identify text for translation
  const processedEntries = dataEntries.map(entry => {
    const expanded = expandAbbreviations(entry.definition, abbrMap)
    const textForTranslation = stripTagsForTranslation(expanded)

    return {
      word: entry.headword.trim(),
      expandedKhmer: expanded.replace(/[\r\n]+/g, '<br>'),
      translationKey: textForTranslation,
    }
  })

  const uniqueTextsToTranslate = new Set<NonEmptyStringTrimmed>()
  for (const entry of processedEntries) {
    if (entry.translationKey && !/^\d+$/.test(entry.translationKey)) {
      uniqueTextsToTranslate.add(nonEmptyString_afterTrim(entry.translationKey))
    }
  }

  console.log(`🌐 Translating ${uniqueTextsToTranslate.size} unique full-length definitions...`)

  const translateDb = openDB()
  const translationsMap = await translateWithRetryForever(() =>
    translateSrt(translateDb, {
      strs: Set_toNonEmptySet_orThrow(uniqueTextsToTranslate),
      languageFrom: CONFIG.sourceLang,
      languageTo: CONFIG.targetLang,
    }),
  )

  const dictDb = new Database(DB_PATH)

  try {
    // 2. Ensure columns exist
    const tableInfo = dictDb.query('PRAGMA table_info(km_en_tbl_Dict)').all() as { name: string }[]
    const existingCols = new Set(tableInfo.map(c => c.name))

    if (!existingCols.has('from_chuon_nath')) {
      console.log('➕ Adding column from_chuon_nath')
      dictDb.run('ALTER TABLE km_en_tbl_Dict ADD COLUMN from_chuon_nath TEXT')
    }
    if (!existingCols.has('from_chuon_nath_translated')) {
      console.log('➕ Adding column from_chuon_nath_translated')
      dictDb.run('ALTER TABLE km_en_tbl_Dict ADD COLUMN from_chuon_nath_translated TEXT')
    }

    // 3. Prepare Upsert
    const upsertStmt = dictDb.prepare(`
      INSERT INTO km_en_tbl_Dict (Word, WordDisplay, Desc, Phonetic, from_chuon_nath, from_chuon_nath_translated)
      VALUES ($word, '', '', '', $expanded, $translated)
      ON CONFLICT(Word) DO UPDATE SET
        from_chuon_nath = excluded.from_chuon_nath,
        from_chuon_nath_translated = excluded.from_chuon_nath_translated
    `)

    console.log('🚀 Syncing to Database...')

    const transaction = dictDb.transaction(items => {
      for (const item of items) {
        const translatedContent = translationsMap.get(item.translationKey) || ''

        upsertStmt.run({
          $word: item.word,
          $expanded: item.expandedKhmer,
          $translated: translatedContent,
        })
      }
    })

    transaction(processedEntries)

    console.log('✅ Success! Database updated and optimized.')
    dictDb.run('VACUUM;')
  } finally {
    dictDb.close()
  }
}

migrate().catch(console.error)
