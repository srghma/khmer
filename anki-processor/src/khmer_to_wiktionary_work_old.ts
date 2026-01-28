#!/usr/bin/env node

import * as fs from 'fs/promises'
import {
  nonEmptyArrayOfString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed.js'
import {
  Array_partition,
  Array_unique_usingSet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/array.js'
import { parseLine, type AnkiCard } from './parse-anki-file.js'
import { Set_mkOrLogIfArrayIsNotUnique } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sets.js'
import { WiktionaryCache_create } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-cache.js'
import { processQueue } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-fetch.js'
import { cleanWiktionaryHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-extractor2.js'
import { toTXTRow } from './output-csv-file.js'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts.js'

// Main processing function
const main = async () => {
  const [, , inputFile, outputFile] = process.argv

  if (!inputFile || !outputFile) {
    console.error('Usage: ts-node process-anki.ts <input.txt> <output.txt>')
    process.exit(1)
  }

  const content = await fs.readFile(inputFile, 'utf8')
  const lines: readonly NonEmptyStringTrimmed[] = nonEmptyArrayOfString_afterTrim(content.trim().split('\n'))

  // Separate header and data lines
  const [, dataLines] = Array_partition(lines, line => line.startsWith('#') || line === '')

  const cards: readonly AnkiCard[] = dataLines.map(parseLine)
  console.log(cards)
  const uniqueWords: Set<NonEmptyStringTrimmed> = Set_mkOrLogIfArrayIsNotUnique(cards.flatMap(x => x.words))

  console.log(`Total Valid Cards: ${cards.length}`)
  console.log(`Unique Words to process: ${uniqueWords.size}`)
  console.log(`Max size of words inside of one card: ${Array_unique_usingSet(cards.map(x => x.words.length)).sort()}`) // 6

  // 6. Initialize Cache (IO)
  // We assume cache file is valid or empty
  const CACHE_FILE = './wiktionary.jsonl' as NonEmptyStringTrimmed
  const cache = await WiktionaryCache_create(CACHE_FILE)

  // 7. Run Fetch Pipeline (IO)
  await processQueue(uniqueWords, cache)

  // 8. (Optional) Write Output logic here
  // const outputLines = cards.map(card => { ... logic using cache.get(word) ... })
  // await fs.writeFile(outputFile, ...)

  // 4. Generate Output Rows
  console.log('Generating output CSV...')

  const outputRows: string[] = cards
    .map(card => {
      // 1. Map words to cleaned HTML
      const cleanedHtmls: (NonEmptyStringTrimmed | undefined)[] = card.words.map(word => {
        const entry = assertIsDefinedAndReturn(cache.get(word))
        // Handle 404 or Missing
        if (entry.t === '404') return
        // Clean HTML
        const cleaned = cleanWiktionaryHtml(entry.html)
        return cleaned
      })

      if (cleanedHtmls.every(x => x === undefined)) return

      // 3. Create Row
      return toTXTRow({
        word: card.word,
        html1: cleanedHtmls[0],
        html2: cleanedHtmls[1],
        html3: cleanedHtmls[2],
        html4: cleanedHtmls[3],
        html5: cleanedHtmls[4],
        html6: cleanedHtmls[5],
      })
    })
    .filter(x => x !== undefined)

  // ---------------------------------------------------------
  // Prepare File Content with Anki Headers
  // Ref: https://docs.ankiweb.net/importing/text-files.html#file-headers
  // ---------------------------------------------------------
  const fileContent = [
    '#separator:tab', // We use tabs in toTXTRow
    '#html:true', // We are outputting HTML
    // '#guid column:1', // The first column (id) is the unique identifier
    ...outputRows,
    // 'GUID\tWiktionary1\tWiktionary2\tWiktionary3\tWiktionary4\tWiktionary5\tWiktionary6',
  ].join('\n')

  await fs.writeFile(outputFile, fileContent, 'utf8')

  console.log(`Done. Output written to ${outputFile}`)
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
