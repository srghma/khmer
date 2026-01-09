#!/usr/bin/env bun

import * as fs from "fs"
import * as path from "path"
import {
  openDB,
  translateSrt,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/open-google-translate-cached"
import { parseDictionaryFile } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/dict-parser"
import {
  type NonEmptyStringTrimmed,
  String_toNonEmptyString_orUndefined_afterTrim,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed"
import { Set_toNonEmptySet_orThrow } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set"

// --- Configuration ---

const CONFIG = {
  inputFile:
    "/home/srghma/projects/khmer-dicts-1/ChuonNathKmKm.dict" as NonEmptyStringTrimmed,
  outputFile:
    "/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.dict" as NonEmptyStringTrimmed,
  sourceLang: "km" as const, // Type as LanguageCode
  targetLang: "en" as const,
}

// --- Helpers ---

// Matches Khmer punctuation "។" or newlines to split definitions into logical sentences
const DEFINITION_SPLIT_REGEX = /([។\n]+)/

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim()

/**
 * Removes <abr>...</abr> blocks entirely so grammar codes (n., v., etc.)
 * don't confuse the translator.
 */
const prepareTextForTranslation = (
  htmlFragment: string,
): NonEmptyStringTrimmed | undefined => {
  const withoutAbr = htmlFragment.replace(/<abr>.*?<\/abr>/gi, "")
  const stripped = stripTags(withoutAbr)

  // Filter out pure numbers or empty strings
  if (/^\d+$/.test(stripped)) return undefined

  return String_toNonEmptyString_orUndefined_afterTrim(stripped)
}

// --- Core Logic ---

async function main() {
  console.log("--- Starting Dictionary Translator ---")

  // 1. Read and Parse
  const inputPath = path.resolve(CONFIG.inputFile)
  if (!fs.existsSync(inputPath)) {
    throw new Error(`File not found: ${inputPath}`)
  }

  const content = fs.readFileSync(inputPath, "utf-8")
  const entries = parseDictionaryFile(content)
  console.log(`Parsed ${entries.length} entries.`)

  // 2. Collect all translatable segments
  // We use a Set to automatically deduplicate repeated phrases across the dictionary
  const segmentsToTranslate = new Set<NonEmptyStringTrimmed>()

  // We pre-calculate segments to avoid splitting regex twice (speed optimization)
  // structuredEntries: { entry: DictEntry, segments: string[] }[]
  const structuredEntries = entries.map((entry) => {
    const segments = entry.definition.split(DEFINITION_SPLIT_REGEX)

    segments.forEach((seg) => {
      const cleanText = prepareTextForTranslation(seg)
      if (cleanText) {
        segmentsToTranslate.add(cleanText)
      }
    })

    return { entry, segments }
  })

  console.log(
    `Identified ${segmentsToTranslate.size} unique segments to translate.`,
  )

  // 3. Perform Batch Translation (Cached)
  const db = openDB()

  let translationsMap = new Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed>()

  if (segmentsToTranslate.size > 0) {
    // translateSrt handles chunking, rate limiting, and caching internally
    translationsMap = await translateSrt(db, {
      strs: Set_toNonEmptySet_orThrow(segmentsToTranslate),
      languageFrom: CONFIG.sourceLang,
      languageTo: CONFIG.targetLang,
    })
  }

  console.log("Translation complete. Reconstructing dictionary...")

  // 4. Reconstruct Content
  const outputLines = structuredEntries.map(({ entry, segments }) => {
    const translatedDefinition = segments
      .map((seg) => {
        const cleanKey = prepareTextForTranslation(seg)

        // If we have a clean key, look it up
        if (cleanKey) {
          const trans = translationsMap.get(cleanKey)
          if (trans) {
            // Append translation styled in a span
            // We use <br/> before the span to break line if it's a long definition,
            // or just space depending on preference. Using space here for flow.
            return `${seg} <span style="color: #666; font-style: italic;"> [${trans}]</span>`
          }
        }

        // Return original segment (punctuation, tags, or untranslated text)
        return seg
      })
      .join("")

    return `<k>${entry.headword}</k>\n<dtrn>${translatedDefinition}</dtrn>`
  })

  // 5. Write Output
  fs.writeFileSync(CONFIG.outputFile, outputLines.join("\n"), "utf-8")
  console.log(`Done! Saved to ${CONFIG.outputFile}`)
}

main().catch((e) => {
  console.error("Fatal Error:", e)
  process.exit(1)
})
