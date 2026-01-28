#!/usr/bin/env bun

import * as fs from "fs"
import * as path from "path"
import { openDB } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/open-google-translate-cache"
import { translateSrt } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/open-google-translate-cached"
import { parseDictionaryFile } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/dict-parser"
import {
  type NonEmptyStringTrimmed,
  String_toNonEmptyString_orUndefined_afterTrim,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed"
import { Set_toNonEmptySet_orThrow } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set"
import { translateWithRetryForever } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/retry"
import { assertIsDefinedAndReturn } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts"
import { colorizeKhmerHtml } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/colorize-html"
import {
  strToKhmerWordOrThrow,
  TypedKhmerWord,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word"

// --- Configuration ---

export const CONFIG = {
  inputFile:
    "/home/srghma/projects/khmer-dicts/khm-khm_ChuonNath/ChuonNathKmKm.dict" as NonEmptyStringTrimmed,
  outputFile:
    "/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.tab" as NonEmptyStringTrimmed,
  spellcheckerDictFile:
    "/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt" as NonEmptyStringTrimmed,
  sourceLang: "km" as const,
  targetLang: "en" as const,
} as const

// --- Helpers ---

// Include \r to handle Windows line endings safely during split
export const DEFINITION_SPLIT_REGEX = /([។\r\n]+)/

const stripTags = (html: string): string =>
  html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim()

/**
 * Extracts abbreviation map from the raw file content.
 * Scans the beginning of the file for the pattern: <abr>ABBR</abr> ... — FULL_TEXT
 */
export const extractAbbreviationMap = (
  content: string,
): Map<string, string> => {
  const map = new Map<string, string>()

  // Legend pattern: <abr>កិ.</abr></co></i> — កិរិយាសព្ទ
  // Using a more flexible regex to handle the header chunk
  const regex = /<abr>([^<]+)<\/abr><\/co><\/i>\s*—\s*([^<\r\n]+)/g

  // We only look at the first 20,000 characters which contains the entire legend
  const headerChunk = content.slice(0, 20000)

  let match
  while ((match = regex.exec(headerChunk)) !== null) {
    const abbr = match[1]!.trim()
    const full = match[2]!.trim()
    if (abbr && full) {
      map.set(abbr, full)
    }
  }

  if (map.size === 0) {
    throw new Error(
      "Failed to extract any abbreviations from the file header. Check if the legend format matches.",
    )
  }

  return map
}

/**
 * Replaces <abr> tags with their full text from the map.
 * Throws error if a key found in the content is missing from the legend.
 */
export const expandAbbreviations = (
  html: string,
  abbrToFull: Map<string, string>,
): string => {
  return html.replace(/<abr>(.*?)<\/abr>/gi, (_, abbr: string) => {
    const key = abbr.trim()
    const fullValue = abbrToFull.get(key)
    if (!fullValue) {
      throw new Error(
        `Abbreviation replacement not found in Map for key: "${key}". Make sure the legend entry exists.`,
      )
    }
    return fullValue
  })
}

export const prepareTextForTranslation = (
  htmlFragment: string,
  abbrToFull: Map<string, string>,
): NonEmptyStringTrimmed | undefined => {
  // 1. Expand abbreviations (e.g., <abr>កិ.</abr> -> កិរិយាសព្ទ)
  const expanded = expandAbbreviations(htmlFragment, abbrToFull)

  // 2. Strip tags for the translator
  const stripped = stripTags(expanded)

  // Skip pure numbers or empty strings
  if (/^\d+$/.test(stripped)) return undefined

  return String_toNonEmptyString_orUndefined_afterTrim(stripped)
}

const loadSpellcheckerDict = (filePath: string): Set<TypedKhmerWord> => {
  console.log(`Loading Spellchecker reference from: ${filePath}`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dictionary file not found: ${filePath}`)
  }

  const dictContent = fs.readFileSync(filePath, "utf-8")
  const words = dictContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(strToKhmerWordOrThrow)

  console.log(`Loaded ${words.length} valid Khmer words.`)
  return new Set(words)
}

// --- Core Logic ---

async function main() {
  console.log("--- Starting Dictionary Translator ---")

  const inputPath = path.resolve(CONFIG.inputFile)
  if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`)

  const rawContent = fs.readFileSync(inputPath, "utf-8")

  // 1. Load Spellchecker Dict
  const validKhmerWords = loadSpellcheckerDict(CONFIG.spellcheckerDictFile)

  // 2. Extract Abbreviations from the raw string
  const abbrMap = extractAbbreviationMap(rawContent)
  console.log(`Extracted ${abbrMap.size} abbreviations from legend.`)

  // 3. Parse into entries
  const entries = parseDictionaryFile(rawContent)
  console.log(`Parsed ${entries.length} entries.`)

  // 4. Process segments
  // Note: We skip entries[0] because in your file, it's the header/legend itself
  const dataEntries = entries.slice(1)

  const structuredEntries = dataEntries.map((entry) => ({
    entry,
    segments: entry.definition.split(DEFINITION_SPLIT_REGEX),
  }))

  const segmentsToTranslate = new Set<NonEmptyStringTrimmed>()
  for (const { segments } of structuredEntries) {
    for (const seg of segments) {
      const cleanText = prepareTextForTranslation(seg, abbrMap)
      if (cleanText) {
        segmentsToTranslate.add(cleanText)
      }
    }
  }

  console.log(
    `Identified ${segmentsToTranslate.size} unique segments to translate.`,
  )

  // 5. Perform Batch Translation
  const db = openDB()
  let translationsMap = new Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed>()

  if (segmentsToTranslate.size > 0) {
    translationsMap = await translateWithRetryForever(() =>
      translateSrt(db, {
        strs: Set_toNonEmptySet_orThrow(segmentsToTranslate),
        languageFrom: CONFIG.sourceLang,
        languageTo: CONFIG.targetLang,
      }),
    )
  }

  // 6. Reconstruct Content
  // Add the legend back exactly as it was (First entry).
  // CRITICAL: Replace all possible newline variants with <br> to ensure Tabfile format validity.
  const legendEntry = assertIsDefinedAndReturn(entries[0])
  const legendLine = `${legendEntry.headword}\t${legendEntry.definition.replace(/[\r\n]+/g, "<br>")}`

  // Add translated data entries
  const dataLines = structuredEntries.map(({ entry, segments }) => {
    const translatedDefinition = segments
      .map((seg) => {
        // Colorize the segment using the spellchecker dictionary
        const colorizedSeg = colorizeKhmerHtml(seg, validKhmerWords)

        const cleanKey = prepareTextForTranslation(seg, abbrMap)
        const trans = cleanKey ? translationsMap.get(cleanKey) : undefined

        if (trans) {
          return `${colorizedSeg} <span style="color: #666; font-style: italic;"> [${trans}]</span>`
        }

        return colorizedSeg
      })
      .join("")

    // Ensure absolutely no newlines remain in the final definition string
    const cleanDefinition = translatedDefinition.replace(/[\r\n]+/g, "<br>")
    const cleanHeadword = entry.headword.replace(/[\r\n]+/g, " ")

    return `${cleanHeadword}\t${cleanDefinition}`
  })

  // 7. Write Output
  const outputContent = [legendLine, ...dataLines].join("\n")
  fs.writeFileSync(CONFIG.outputFile, outputContent, "utf-8")
  console.log(`Done! Saved to ${CONFIG.outputFile}`)
  process.exit(0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("Fatal Error:", e)
    process.exit(1)
  })
}

// rm -f '/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.slob'
// pyglossary "/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.tab" '/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.slob' --read-format=Tabfile --write-format=Aard2Slob
// rm -f "/home/srghma/projects/khmer-dicts/ChuonNathKmKm-colorized.tab"
