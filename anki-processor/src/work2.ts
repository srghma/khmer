#!/usr/bin/env node

import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import {
  nonEmptyArrayOfString_afterTrim,
  type NonEmptyStringTrimmed,
  unknown_isNonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed.js'
import { Array_partition } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/array.js'
import { parseLine, type AnkiCard } from './parse-anki-file.js'
import {
  WiktionaryCache_create,
  type WiktionaryCache,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-cache-db.js'
import { processQueue } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-fetch.js'
import { cleanWiktionaryHtml } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/wiktionary-extractor2.js'
import { toTXTRow } from './output-csv-file.js'
import { DictionaryManager } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/dictionary.js'
import jsonlines from 'jsonlines'

const JSONL_CACHE_FILE = './wiktionary.jsonl'
const DICTIONARY_FILE = '/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt'

// Helper to migrate legacy JSONL to SQLite
const migrateJsonlToDb = async (cache: WiktionaryCache) => {
  if (!fsSync.existsSync(JSONL_CACHE_FILE)) {
    console.log(`No legacy JSONL file found at ${JSONL_CACHE_FILE}, skipping migration.`)
    return
  }

  console.log('Migrating legacy JSONL cache to SQLite...')
  const stream = fsSync.createReadStream(JSONL_CACHE_FILE)
  const parser = jsonlines.parse()

  let migratedCount = 0

  stream.pipe(parser)

  for await (const row of parser) {
    const entry = row as any
    if (entry.word && unknown_isNonEmptyStringTrimmed(entry.word)) {
      const word: NonEmptyStringTrimmed = entry.word
      if (!cache.has(word)) {
        if (entry.status === 404) {
          await cache.add404(word)
        } else if (entry.html && unknown_isNonEmptyStringTrimmed(entry.html)) {
          await cache.addSuccess(word, entry.html)
        }
        migratedCount++
      }
    }
  }

  console.log(`Migration complete. Added ${migratedCount} new entries from JSONL.`)
}

// Helper to segment words and add to the set
const expandWordsWithIntlSegmenter = (words: Set<NonEmptyStringTrimmed>) => {
  console.log('Expanding word list using Intl.Segmenter (km)...')

  const segmenter = new Intl.Segmenter('km', { granularity: 'word' })
  const segmentedWordsToAdd = new Set<NonEmptyStringTrimmed>()

  // Iterate over existing words to find sub-segments
  for (const word of words) {
    const segments = segmenter.segment(word)

    for (const { segment, isWordLike } of segments) {
      if (isWordLike && unknown_isNonEmptyStringTrimmed(segment)) {
        segmentedWordsToAdd.add(segment)
      }
    }
  }

  const initialSize = words.size

  // Merge new segments into the main set
  for (const w of segmentedWordsToAdd) {
    words.add(w)
  }

  const newSize = words.size
  console.log(`Added ${newSize - initialSize} new sub-words from segmentation. Total words to process: ${newSize}`)
}

// Main processing function
const main = async () => {
  const [, , inputFile, outputFile] = process.argv

  // 1. Initialize DB Cache
  const cache = await WiktionaryCache_create()

  // 2. Migrate existing JSONL data if present
  await migrateJsonlToDb(cache)

  // 3. Load words from Dictionary
  console.log(`Loading dictionary from ${DICTIONARY_FILE}...`)
  const dictManager = new DictionaryManager(DICTIONARY_FILE)
  dictManager.load()
  const dictionaryWords = dictManager.getWords()
  console.log(`Loaded ${dictionaryWords.size} words from dictionary.`)

  const wordsToFetch = new Set<NonEmptyStringTrimmed>()

  for (const w of dictionaryWords) {
    if (unknown_isNonEmptyStringTrimmed(w)) {
      wordsToFetch.add(w)
    }
  }

  // 4. Also include words from input Anki file if provided
  let cardWords: Set<NonEmptyStringTrimmed> = new Set()
  let cards: readonly AnkiCard[] = []

  if (inputFile && outputFile) {
    console.log(`Reading input file: ${inputFile}`)
    const content = await fs.readFile(inputFile, 'utf8')
    const lines: readonly NonEmptyStringTrimmed[] = nonEmptyArrayOfString_afterTrim(content.trim().split('\n'))
    const [, dataLines] = Array_partition(lines, line => line.startsWith('#') || line === '')
    cards = dataLines.map(parseLine)

    // Collect words from cards
    cards
      .flatMap(x => x.words)
      .forEach(w => {
        wordsToFetch.add(w)
        cardWords.add(w)
      })

    console.log(`Added words from input file. Total unique words before segmentation: ${wordsToFetch.size}`)
  } else {
    console.log(`No input/output files provided. Processing ${wordsToFetch.size} words from dictionary only.`)
  }

  // 5. Expand list with Intl.Segmenter
  expandWordsWithIntlSegmenter(wordsToFetch)

  // 6. Run Fetch Pipeline
  await processQueue(wordsToFetch, cache)

  // 7. Generate Output CSV (Only if input/output files were provided)
  if (inputFile && outputFile) {
    console.log('Generating output CSV...')

    const outputRows: string[] = cards
      .map(card => {
        // Map words to cleaned HTML
        const cleanedHtmls: (NonEmptyStringTrimmed | undefined)[] = card.words.map(word => {
          const entry = cache.get(word)

          if (!entry || entry.t === '404') return undefined

          // Clean HTML
          return cleanWiktionaryHtml(entry.html)
        })

        if (cleanedHtmls.every(x => x === undefined)) return undefined

        // Create Row
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
      .filter((x): x is string => x !== undefined)

    const fileContent = ['#separator:tab', '#html:true', ...outputRows].join('\n')

    await fs.writeFile(outputFile, fileContent, 'utf8')
    console.log(`Done. Output written to ${outputFile}`)
  } else {
    console.log('Done processing dictionary queue.')
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
